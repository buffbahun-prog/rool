import { decryptData, encryptData } from "../../crypto/encrypt-decrypt";
import { FileMetadata, WorkerAction, WorkerRequest, WorkerResponse, type ChunkPayload, type SenderFileRecord } from "../../types";
import { createChunkBitmap, getMissingChunks, isBitmapComplete, isChunkReceived, setChunkReceived } from "../../utils/convert";
import { SHA256 } from "../../utils/hasher";
import { encodeChunksBitmap } from "../peer-transfer";
import { decodeChunkPayload, encodeChunkPayload} from "../transfer";

let localTransferKey: CryptoKey | null = null;
let remoteTransferKey: CryptoKey | null = null;
let fileMetadata: {file: File, fileId: number, chunkSize: number, totalChunks: number, retryBitmap?: Uint8Array, lastChunkIdForRetryBitmap?: number} | null = null;
let fileWritable: {
    metadata: FileMetadata;
    chunkSize: number;
    fileHandle: FileSystemFileHandle;
    writable: FileSystemWritableFileStream;
    bytesWritten: number;
    chunksBitMap: Uint8Array;
} | null = null;

let chunkHashedTo: number = 0;
let chunkIdHashedTo: number = -1;
let sha256Hahser: SHA256 = new SHA256();
let fileHash: null | string = null;
let isHashRunning = false;

const bufferQueue: {
  response: {
        packet: ArrayBuffer;
        chunkId: number;
        fileId: number;
        isLastChunk: boolean;
    }[];
  reader: number;
  writer: number;   
} = {
    response: [],
    reader: 0,
    writer: 0,
};
const MAX_QUEUE = 10;
let isQueueFillRunning = false;
let isQueuePopRunning = false;

let queueSpaceResolver: (() => void) | null = null;

async function waitForQueueSpace(): Promise<void> {
    if (bufferQueue.writer - bufferQueue.reader < MAX_QUEUE) {
        return;
    }

    return new Promise<void>((resolve) => {
        queueSpaceResolver = resolve;
    });
    
}

let queueHaveChunkResolver: (() => void) | null = null;

async function waitForQueueHaveChunk(): Promise<void> {
    if (bufferQueue.writer - bufferQueue.reader > 0) {
        return;
    }

    return new Promise<void>((resolve) => {
        queueHaveChunkResolver = resolve;
    });
    
}

let isPaused = false;
let isBackpressurePaused = false;

let resumeResolveer: (() => void) | null = null;
async function waitForResume(): Promise<void> {
    if (!isPaused && !isBackpressurePaused) {
        return;
    }

    return new Promise<void>((resolve) => {
        resumeResolveer = resolve;
    });
}

let fileSlice: null | 
               {readView: Uint8Array,
                startChunkId: number,
                totalChunks: number} = null;

self.onmessage = async (e: MessageEvent<WorkerRequest>) => {
  const { action, payload } = e.data;
  
  switch (action) {
    case WorkerAction.GetLocalTransferKey: {
        localTransferKey = payload.transferKey;
        break;
    }
    case WorkerAction.GetRemoteTransferKey: {
        remoteTransferKey = payload.transferKey;
        break;
    }
    case WorkerAction.GetMetadata: {
        fileMetadata = payload;
        break;
    }
    case WorkerAction.InitWritable: {
        try {
            await initFileWritabe(payload.metadata, payload.chunkSize);
        }
        catch(e: any) {
            const response: WorkerResponse = {
                action: action,
                status: "ERROR",
                error: e.message,
            }
            self.postMessage(response);
        } finally {
            break;
        }
    }
    case WorkerAction.SetIncomingChunk: {
        try {
            await decodeDecryptAndWriteToDisk(payload.packet);
        } catch(err: any) {
            const response: WorkerResponse = {
                action: action,
                status: "ERROR",
                error: err.message,
            }
            self.postMessage(response);
        } finally {
            break;
        }
    }
    case WorkerAction.InitEncryption:{
        try {
            if (!fileMetadata) throw new Error("worker: file meta not initialized.");
            if (payload.fileId !== fileMetadata.fileId) return;

            isQueueFillRunning = false;
            bufferQueue.response = [];
            bufferQueue.reader = 0;
            bufferQueue.writer = 0;
            if (payload.start) fillChunkQueue(payload.fileId, payload.chunkId);

            const initEncResp: WorkerResponse = {
                action: action,
                status: "SUCCESS",
                result: {
                    fileId: fileMetadata.fileId,
                    start: payload.start,
                }
            }
            self.postMessage(initEncResp);
        } catch(e: any) {
            const response: WorkerResponse = {
                action: action,
                status: "ERROR",
                error: e.message,
            }
            console.error(e);
            self.postMessage(response);
        } finally{
            break;
        }
    }
    case WorkerAction.InitGetChunks:{
        try {
            if (!fileMetadata) throw new Error("worker: file meta not initialized.");
            if (payload.fileId !== fileMetadata.fileId) throw new Error(`worker: no worker with fileId: ${payload.fileId} found`);

            isQueuePopRunning = false;
            popChunkQueue();
        } catch(e: any) {
            console.error(e);
        } finally{
            break;
        }
    }
    case WorkerAction.Pause: {
        try {
            if (!fileMetadata) throw new Error("worker: file meta not initialized.");
            if (payload.fileId !== fileMetadata.fileId) throw new Error(`worker: no worker with fileId: ${payload.fileId} found`);
            if (isPaused) return;
            isPaused = true;
        } catch(e: any) {
            console.error(e);
        } finally{
            break;
        }
    }
    case WorkerAction.Resume: {
        try {
            if (!fileMetadata) throw new Error("worker: file meta not initialized.");
            if (payload.fileId !== fileMetadata.fileId) throw new Error(`worker: no worker with fileId: ${payload.fileId} found`);
            if (!isPaused) return;
            isPaused = false;
            isBackpressurePaused = false;
            if (!isPaused && !isBackpressurePaused) {
                if (resumeResolveer) {
                    resumeResolveer();
                    resumeResolveer = null;
                }
            }
        } catch(e: any) {
            console.error(e);
        } finally{
            break;
        }
    }
    case WorkerAction.BackpressurePause: {
        try {
            if (!fileMetadata) throw new Error("worker: file meta not initialized.");
            if (payload.fileId !== fileMetadata.fileId) throw new Error(`worker: no worker with fileId: ${payload.fileId} found`);
            if (isBackpressurePaused) return;
            isBackpressurePaused = true;
        } catch(e: any) {
            console.error(e);
        } finally{
            break;
        }
    }
    case WorkerAction.BackpressureResume: {
        try {
            if (!fileMetadata) throw new Error("worker: file meta not initialized.");
            if (payload.fileId !== fileMetadata.fileId) throw new Error(`worker: no worker with fileId: ${payload.fileId} found`);
            if (!isBackpressurePaused) return;
            isBackpressurePaused = false;
            if (!isPaused && !isBackpressurePaused) {
                if (resumeResolveer) {
                    resumeResolveer();
                    resumeResolveer = null;
                }
            }
        } catch(e: any) {
            console.error(e);
        } finally{
            break;
        }
    }
    case WorkerAction.GetBitmap: {
        try {
            if (!fileWritable) throw new Error("worker: file writable not initialized.");
            if (payload.fileId !== fileWritable.metadata.fileId) throw new Error("worker: file with id " + payload.fileId + " not initialized.");
            const bitMap = fileWritable.chunksBitMap;
            const totalChunks = fileWritable.metadata.totalChunks;
            const packet = encodeChunksBitmap(fileWritable.metadata.fileId, totalChunks, bitMap).buffer as ArrayBuffer;
            const response: WorkerResponse = {
                action: action,
                status: "SUCCESS",
                result: {fileId: fileWritable.metadata.fileId, packet: packet},
            };
            // @ts-ignore
            self.postMessage(response, [packet]);
        } catch(e: any) {
            const response: WorkerResponse = {
                action: action,
                status: "ERROR",
                error: e.message,
            }
            console.error("err bitmap", e.message)
            self.postMessage(response);
        } finally {
            break;
        }
    }
    case WorkerAction.RetryMissingChunks: {
        try {
            if (!fileMetadata) throw new Error("worker: file meta not initialized.");
            if (payload.fileId !== fileMetadata.fileId) return;
            fileMetadata.retryBitmap = new Uint8Array(payload.bitmap);
            fileMetadata.lastChunkIdForRetryBitmap = Math.max(...getMissingChunks(fileMetadata.retryBitmap, fileMetadata.totalChunks));

            const response: WorkerResponse = {
                action: action,
                status: "SUCCESS",
                result: {fileId: fileMetadata.fileId}
            }

            self.postMessage(response);

        } catch (err: any) {
            const response: WorkerResponse = {
                action: action,
                status: "ERROR",
                error: err.message,
            }
            self.postMessage(response);
        } finally {
            break;
        }
    }
    case WorkerAction.GetFileHash: {
        try {
            if (!fileMetadata) throw new Error("worker: file meta not initialized.");
            if (payload.fileId !== fileMetadata.fileId) return;

            createHash(fileMetadata.file, fileMetadata.fileId);

        } catch (err: any) {
            const response: WorkerResponse = {
                action: action,
                status: "ERROR",
                error: err.message,
            }
            self.postMessage(response);
        } finally {
            break;
        }
    }
    case WorkerAction.GetFileDownload: {
        try {
            if (!fileWritable) throw new Error("worker: file writable not initialized.");
            if (payload.fileId !== fileWritable.metadata.fileId) return;

            const fileName = fileWritable.fileHandle.name;

            const response: WorkerResponse = {
                action: action,
                status: "SUCCESS",
                result: {fileId: fileWritable.metadata.fileId, fileName}
            }

            self.postMessage(response);

        } catch (err: any) {
            const response: WorkerResponse = {
                action: action,
                status: "ERROR",
                error: "get download error " + err.message,
            }
            console.error(err, "here");
            self.postMessage(response);
        } finally {
            break;
        }
    }
  }
};

async function fillChunkQueue(fileId: number, chunkId: number) {
    try {
        isQueueFillRunning = true;
        if (!fileMetadata) throw new Error("worker: file meta not initialized.");
        if (fileId !== fileMetadata.fileId) throw new Error(`worker: worker with fileId ${fileId} not found.`);

        while (chunkId < fileMetadata.totalChunks) {
            if (!isQueueFillRunning) return;

            await waitForQueueSpace();

            const resultPacket = await encryptAndEncodeChunk(fileMetadata, chunkId);

            if (resultPacket) {
                const isLastChunk = (chunkId === fileMetadata.totalChunks - 1)
                                    || ((fileMetadata.retryBitmap !== undefined)
                                        && (fileMetadata.lastChunkIdForRetryBitmap !== undefined)
                                        && (chunkId === fileMetadata.lastChunkIdForRetryBitmap));

                if (isLastChunk && !fileHash) fileHash = sha256Hahser.digest();

                const bufferResp = {
                    packet: resultPacket,
                    chunkId: chunkId,
                    fileId: fileMetadata.fileId,
                    isLastChunk: isLastChunk,
                };
                if (bufferQueue.response.length < MAX_QUEUE) {
                    bufferQueue.response.push(bufferResp);
                } else {
                    bufferQueue.response[bufferQueue.writer % MAX_QUEUE] = bufferResp;
                }
                bufferQueue.writer = bufferQueue.writer + 1;
                if ((bufferQueue.writer - bufferQueue.reader > 0) && queueHaveChunkResolver) {
                    queueHaveChunkResolver();
                    queueHaveChunkResolver = null;
                }
            }
            chunkId++;
        }
    } catch(e: any) {
        const response: WorkerResponse = {
            action: WorkerAction.GetNextChunk,
            status: "ERROR",
            error: e.message,
        }
        self.postMessage(response);
    } finally {
        isQueueFillRunning = false;
    }
}

async function popChunkQueue() {
    try {
        isQueuePopRunning = true;
        while (isQueueFillRunning || (bufferQueue.writer - bufferQueue.reader) > 0) {
            if (!isQueuePopRunning) return;

            await waitForResume();
            await waitForQueueHaveChunk();

            const resultPayload = bufferQueue.response[bufferQueue.reader % MAX_QUEUE];
            bufferQueue.reader = bufferQueue.reader + 1;

            if (queueSpaceResolver && (bufferQueue.writer - bufferQueue.reader < MAX_QUEUE)) {
                queueSpaceResolver();
                queueSpaceResolver = null;
            }

            if (!resultPayload) throw new Error("worker -> poped buffer queue has no value");

            const packet = resultPayload.packet;

            const response: WorkerResponse = {
                    action: WorkerAction.GetNextChunk,
                    status: "SUCCESS",
                    result: resultPayload
            };

            // @ts-ignore
            if (packet) self.postMessage(response, [packet]);
            else self.postMessage(response);
        }
    } catch (e: any) {
        const response: WorkerResponse = {
            action: WorkerAction.GetNextChunk,
            status: "ERROR",
            error: e.message,
        }
        console.error(e);
        self.postMessage(response);
    } finally {
        isQueuePopRunning = false;
    }
}

async function encryptAndEncodeChunk(fileMeta: {file: File, fileId: number, chunkSize: number, totalChunks: number, retryBitmap?: Uint8Array}, currChunkId: number) {
    if (currChunkId >= fileMeta.totalChunks) {
        throw new Error("worker: chunkId exceeds the total chunks in the file");
    }

    if (fileMeta.retryBitmap && isChunkReceived(fileMeta.retryBitmap, currChunkId)) {
        return null;
    }

    const chunkSize = fileMeta.chunkSize;
    const file = fileMeta.file;
    const fileId = fileMeta.fileId;

    if (!localTransferKey) throw new Error("worker: transfer key not initialized properly");

    const chunk = await getChunk(file, currChunkId, chunkSize);

    const {ciphertext, iv} = await encryptData(chunk, localTransferKey);

    const chunkPayload: ChunkPayload = {
        fileId: fileId,
        chunkId: currChunkId,
        ciphertext: ciphertext,
        iv: iv,
    };

    const encodedChunk = encodeChunkPayload(chunkPayload);

    return encodedChunk.buffer as ArrayBuffer;
}

async function getChunk(file: File, chunkId: number, chunkSize: number): Promise<Uint8Array> {
    const TOTAL_CHUNKS_STORE = 64;
    if (fileSlice && (chunkId >= fileSlice.startChunkId && chunkId < (fileSlice.startChunkId + fileSlice.totalChunks))) {
        const byteStart = (chunkId - fileSlice.startChunkId) * chunkSize;
        const byteEnd = Math.min(byteStart + chunkSize, fileSlice.readView.length);
        return fileSlice.readView.subarray(byteStart, byteEnd);
    }
    
    fileSlice = null;
    const byteStart = chunkId * chunkSize;
    const byteEnd = Math.min(byteStart + (chunkSize * TOTAL_CHUNKS_STORE), file.size);
    const readBuffer = await file.slice(byteStart, byteEnd).arrayBuffer();
    const readView = new Uint8Array(readBuffer);
    fileSlice = {
        readView,
        startChunkId: chunkId,
        totalChunks: Math.min(TOTAL_CHUNKS_STORE, Math.ceil(readView.length / chunkSize)),
    }

    if (fileSlice.startChunkId > chunkIdHashedTo) {
        sha256Hahser.update(fileSlice.readView);
        chunkIdHashedTo += fileSlice.totalChunks;
    }

    return fileSlice.readView.subarray(0, Math.min(chunkSize, readView.length));
}

async function initFileWritabe(metadata: FileMetadata, chunkSize: number) {
    const root = await navigator.storage.getDirectory();

    const fileHandle = await root.getFileHandle(
        `${metadata.fileId}_${metadata.fileName}`,
        { create: true }
    );

    const writable = await fileHandle.createWritable();

    const chunksBitMap = createChunkBitmap(metadata.totalChunks);

    fileWritable = {
        metadata: metadata,
        chunkSize: chunkSize,
        fileHandle: fileHandle,
        writable: writable,
        bytesWritten: 0,
        chunksBitMap: chunksBitMap,
    }
    self.postMessage({action: WorkerAction.InitWritable, status: 'SUCCESS', result: {fileId: metadata.fileId}});
}

async function decodeDecryptAndWriteToDisk(packet: ArrayBuffer): Promise<void> {
  let chunkId: null | number = null;
  try {
    if (!fileWritable) {
        throw new Error("worker: file writable not initialized");
    }

    if (!remoteTransferKey) {
        throw new Error("worker: transfer key not initialized properly");
    }

    const chunkPayload = decodeChunkPayload(new Uint8Array(packet));

    if (chunkPayload.fileId !== fileWritable.metadata.fileId) {
        return;
    }

    if (
        chunkPayload.chunkId < 0 ||
        chunkPayload.chunkId >= fileWritable.metadata.totalChunks
    ) {
        throw new Error(
            `worker: invalid chunk id ${chunkPayload.chunkId}`
        );
    }

    if (
        isChunkReceived(
            fileWritable.chunksBitMap,
            chunkPayload.chunkId
        )
    ) {
        return;
    }

    setChunkReceived(
        fileWritable.chunksBitMap,
        chunkPayload.chunkId
    );

    chunkId = chunkPayload.chunkId;

    const decryptedChunk = await decryptData(
        chunkPayload.ciphertext,
        chunkPayload.iv,
        remoteTransferKey
    );

    await fileWritable.writable.write({
        type: "write",
        position:
            chunkPayload.chunkId *
            fileWritable.chunkSize,
        data: decryptedChunk as BufferSource,
    });

    fileWritable.bytesWritten += decryptedChunk.length;

    if (Math.ceil(fileWritable.bytesWritten / fileWritable.chunkSize) % Math.floor(fileWritable.metadata.totalChunks / 100) === 0 || fileWritable.bytesWritten >= fileWritable.metadata.fileSize) {
        self.postMessage({
            action: WorkerAction.SetIncomingChunk,
            status: "SUCCESS",
            result: {
                chunkId: chunkPayload.chunkId,
                fileId: chunkPayload.fileId,
                bytesWritten: fileWritable.bytesWritten,
            },
        });
    }

    if (
        isBitmapComplete(
            fileWritable.chunksBitMap
        )
    ) {
        fileWritable.writable.close().then(async () => {
            const file = await fileWritable!.fileHandle.getFile();
            createHash(file, fileWritable!.metadata.fileId);
        });
    }
  } catch (err: any) {
    console.error("error", err);
    if (fileWritable && chunkId !== null) {
        setChunkReceived(
            fileWritable.chunksBitMap,
            chunkId,
            true
        );
    }
  }
}

async function createHash(file: File, fileId: number, post = true) {
    if (isHashRunning) return;

    const stream = file.stream();
    const reader = stream.getReader();

    try {
        const hashResp: WorkerResponse = {
            action: WorkerAction.GetFileHash,
            status: "SUCCESS",
            result: {
                fileId: fileId,
                hash: ""
            }
        }
        if (fileHash) {
            if (hashResp.result) hashResp.result.hash = fileHash;
            if (post) self.postMessage(hashResp);
            return;
        }

        isHashRunning = true;

        sha256Hahser.reset();
        chunkHashedTo = 0;

        const hashProgressResp: WorkerResponse = {
            action: WorkerAction.FileHashProgress,
            status: "SUCCESS",
            result: {fileId, bytesWritten: chunkHashedTo, chunkSize: 0, start: true},
        };

        self.postMessage(hashProgressResp)

        while (true) {
            const { done, value } = await reader.read();

            if (done) break;

            sha256Hahser.update(value);
            chunkHashedTo += value.length;

            hashProgressResp.result!.bytesWritten = chunkHashedTo;
            hashProgressResp.result!.chunkSize = value.length;
            hashProgressResp.result!.start = false;
            self.postMessage(hashProgressResp);
        }

        fileHash = sha256Hahser.digest();

        if (hashResp.result) hashResp.result.hash = fileHash;
        if (post) self.postMessage(hashResp);
    } catch (err: any) {
        const hashResp: WorkerResponse = {
            action: WorkerAction.GetFileHash,
            status: "ERROR",
            error: err.message,
        }
        self.postMessage(hashResp);
    } finally {
        reader.releaseLock();
        isHashRunning = false;
    }
}