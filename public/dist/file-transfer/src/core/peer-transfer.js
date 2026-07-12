import { createPeerConnection } from "./webrtc.js";
import { DataType, PeerType, TransferState, WorkerAction } from "../types.js";
import { isBitmapComplete } from "../utils/convert.js";
import { TypedEmitter } from "./emmiter.js";
import { getBigUint64BE, getUint32BE, setBigUint64BE, setUint32BE } from "./transfer.js";
import { SpeedCalculator } from "./speedCalculator.js";
import { createSignature, decryptData, encryptData, exportPublicKeyToBinary, generateEncryptionKeyPair, generateSafetyNumber, generateSigningKeyPair, generateTemporaryTransferKey, importEncryptionPublicKey, importSigningPublicKey, lockTransferKeyWithRemotePublicKey, unlockTransferKeyWithPrivateKey, verifySignature } from "../crypto/encrypt-decrypt.js";
import "./workers/index.worker.js";
export class PeerTransfer extends TypedEmitter {
    constructor(peerType, fileList) {
        super();
        this.workersFileMap = [];
        this.fileTransferState = new Map();
        this.localEncKeys = null;
        this.remoteEncPublicKey = null;
        this.localSigKeys = null;
        this.remoteSigPublicKey = null;
        this.localPrivacyConfirmed = false;
        this.remotePrivacyConfirmed = false;
        this.unwrappedLocalTransferKey = null;
        this.unwrappedRemoteTransferKey = null;
        this.fileMetadataList = null;
        // fileId, boolean
        this.retryChunksAck = new Map();
        this.filesHashAck = new Map();
        this.localFilePause = new Map();
        this.remoteFilePause = new Map();
        //   private chunkIdWrittenTo: Map<number, number> = new Map();
        this.remoteFileHash = new Map();
        this.localFileHash = new Map();
        this.publicKeysRecievedAck = false;
        this.privacyConfirmedAck = false;
        this.transferKeyRecievedAck = false;
        this.fileMetadataRecievedAck = false;
        this.transferPauseAck = false;
        this.filePauseAck = new Map();
        this.fileHandlesForDownload = new Map();
        this.transferState = TransferState.Start;
        this.peerType = peerType;
        this.pc = createPeerConnection();
        this.pendingCandidates = [];
        if (this.peerType === PeerType.Sender) {
            this.dataChannel = this.pc.createDataChannel("fileTransfer", {
                ordered: false,
                maxRetransmits: 0,
            });
            this.dataChannel.bufferedAmountLowThreshold = PeerTransfer.MIN_BUFFER;
            this.dataChannel.binaryType = "arraybuffer";
        }
        else {
            this.dataChannel = null;
        }
        this.fileHandleList = fileList;
        this.localTransferPause = false;
        this.remoteTransferPause = false;
        this.speedCalc = new SpeedCalculator();
    }
    async initWRTC() {
        try {
            if (!this.pc)
                throw new Error("WebRTC nor initialized properly.");
            this.pc.onicecandidate = (event) => {
                const candidates = event.candidate;
                if (candidates) {
                    const candidateEvt = this.peerType === PeerType.Sender ? "senderCandidates" : "recieverCandidates";
                    this.emit(candidateEvt, { value: JSON.stringify(candidates) });
                }
                else {
                }
            };
            this.pc.addEventListener("connectionstatechange", () => {
                console.log("connectionState:", this.pc.connectionState);
            });
            this.pc.addEventListener("iceconnectionstatechange", () => {
                console.log("iceConnectionState:", this.pc.iceConnectionState);
            });
            this.pc.addEventListener("icegatheringstatechange", () => {
                console.log("iceGatheringState:", this.pc.iceGatheringState);
            });
            this.pc.addEventListener("icecandidateerror", (e) => {
                console.log("ICE candidate error:", e);
            });
            if (this.peerType === PeerType.Sender) {
                const offer = await this.pc.createOffer();
                await this.pc.setLocalDescription(offer);
                this.emit("offer", { value: JSON.stringify(this.pc.localDescription) });
                this.dataChannelEvents();
            }
            else {
                this.pc.ondatachannel = (event) => {
                    this.dataChannel = event.channel;
                    this.dataChannel.binaryType = "arraybuffer";
                    this.dataChannelEvents();
                };
            }
            this.localEncKeys = await generateEncryptionKeyPair();
            this.localSigKeys = await generateSigningKeyPair();
        }
        catch (err) {
            this.emit("error", err);
        }
    }
    getConnectionState() {
        return this.pc.connectionState;
    }
    async reconnect() {
    }
    dataChannelEvents() {
        if (!this.dataChannel)
            throw new Error("Data channels not initialized properly");
        this.dataChannel.onopen = () => {
            console.log("data channel opened");
            this.onUpdateTransferState(TransferState.PublicKeySend);
        };
        this.dataChannel.onmessage = (event) => {
            if (!(event.data instanceof ArrayBuffer))
                return;
            const payload = new Uint8Array(event.data);
            this.onRecieveData(payload);
        };
        this.dataChannel.onerror = (ev) => {
            this.emit("error", ev.error);
        };
    }
    async addRemoteCandidate(candidates) {
        const list = Array.isArray(candidates)
            ? candidates
            : [candidates];
        console.log("candidates", list);
        for (const c of list) {
            const candidateObj = JSON.parse(c);
            const exists = this.pendingCandidates.some(x => x.candidate === candidateObj.candidate);
            if (exists)
                continue;
            if (this.pc.remoteDescription) {
                await this.pc.addIceCandidate(candidateObj);
            }
            else {
                this.pendingCandidates.push(candidateObj);
            }
        }
    }
    async setOffer(offerJson) {
        console.log("offer set", offerJson);
        await this.pc.setRemoteDescription(JSON.parse(offerJson));
        for (const candidate of this.pendingCandidates) {
            await this.pc.addIceCandidate(candidate);
        }
        this.pendingCandidates = [];
        await this.createAnswer();
    }
    async createAnswer() {
        const answer = await this.pc.createAnswer();
        await this.pc.setLocalDescription(answer);
        console.log("create answer");
        this.emit("answer", { value: JSON.stringify(this.pc.localDescription) });
    }
    async setAnswer(answerJson) {
        console.log(answerJson, "set answer");
        await this.pc.setRemoteDescription(JSON.parse(answerJson));
        for (const candidate of this.pendingCandidates) {
            await this.pc.addIceCandidate(candidate);
        }
        this.pendingCandidates = [];
    }
    onTransferPause() {
        this.localTransferPause = !this.localTransferPause;
        this.onLocalPause(DataType.TransferPause);
        this.emit("transferPause", {
            by: "local",
            paused: this.localTransferPause,
        });
    }
    onFilePause(fileId) {
        this.localFilePause.set(fileId, !this.localFilePause.get(fileId));
        this.onLocalPause(DataType.FilePause, fileId);
        this.emit("filePause", {
            by: "local",
            fileId: fileId,
            paused: this.localFilePause.get(fileId) ?? false,
        });
    }
    isPaused(fileId) {
        return (this.localTransferPause === true
            || this.remoteTransferPause === true
            || this.localFilePause.get(fileId) === true
            || this.remoteFilePause.get(fileId) === true);
    }
    onLocalPause(pauseType, fileId) {
        if (!this.fileMetadataList || this.fileMetadataList.length <= 0)
            throw new Error("file metadata list not initialized properly");
        if (pauseType === DataType.TransferPause) {
            if (this.peerType === PeerType.Sender) {
                const pausePacket = new Uint8Array(2);
                pausePacket[0] = DataType.TransferPause;
                pausePacket[1] = this.localTransferPause ? 0xff : 0x00;
                this.onPauseEvent();
                this.transferPauseAck = false;
                this.sendUntilAckTrue(pausePacket, () => this.transferPauseAck);
            }
            else {
                const pausePacket = new Uint8Array(2);
                let offset = 0;
                pausePacket[offset] = DataType.TransferPause;
                offset++;
                pausePacket[offset] = this.localTransferPause ? 0xff : 0x00;
                offset++;
                this.transferPauseAck = false;
                this.sendUntilAckTrue(pausePacket, () => this.transferPauseAck);
            }
        }
        else if (pauseType === DataType.FilePause && fileId !== undefined) {
            if (this.peerType === PeerType.Sender) {
                const pausePacket = new Uint8Array(3);
                pausePacket[0] = DataType.FilePause;
                pausePacket[1] = this.localFilePause.get(fileId) ? 0xff : 0x00;
                pausePacket[2] = fileId;
                this.onPauseEvent();
                this.filePauseAck.set(fileId, false);
                this.sendUntilAckTrue(pausePacket, () => this.filePauseAck.get(fileId) ?? false);
            }
            else {
                const pausePacket = new Uint8Array(2 + 1);
                let offset = 0;
                pausePacket[offset] = DataType.FilePause;
                offset++;
                pausePacket[offset] = this.localFilePause.get(fileId) ? 0xff : 0x00;
                offset++;
                pausePacket[offset] = fileId;
                offset++;
                this.filePauseAck.set(fileId, false);
                this.sendUntilAckTrue(pausePacket, () => this.filePauseAck.get(fileId) ?? false);
            }
        }
    }
    async onRemotePause(packet) {
        if (!this.fileMetadataList || this.fileMetadataList.length <= 0)
            throw new Error("file metadata list not initialized properly");
        let offset = 0;
        const pauseType = packet[offset];
        offset++;
        const isPaused = packet[offset] === 0xff;
        offset++;
        if (pauseType === DataType.TransferPause) {
            if (isPaused === this.remoteTransferPause)
                return;
            this.remoteTransferPause = isPaused;
            this.emit("transferPause", {
                by: "remote",
                paused: isPaused,
            });
            if (this.peerType === PeerType.Sender) {
                const pauseAck = new Uint8Array(1);
                pauseAck[0] = DataType.TransferPauseAck;
                await this.sendWithBackPressure(pauseAck);
                this.onPauseEvent();
            }
            else {
                if (!this.fileMetadataList || this.fileMetadataList.length <= 0)
                    throw new Error("file metadata list not initialized properly");
                const pauseAck = new Uint8Array(1);
                let offset = 0;
                pauseAck[offset] = DataType.TransferPauseAck;
                offset++;
                await this.sendWithBackPressure(pauseAck);
            }
        }
        else if (pauseType === DataType.FilePause) {
            const fileId = packet[offset];
            offset++;
            if (isPaused === this.remoteFilePause.get(fileId))
                return;
            this.remoteFilePause.set(fileId, isPaused);
            this.emit("filePause", {
                by: "remote",
                fileId: fileId,
                paused: isPaused,
            });
            if (this.peerType === PeerType.Sender) {
                const pauseAck = new Uint8Array(2);
                pauseAck[0] = DataType.FilePauseAck;
                pauseAck[1] = fileId;
                await this.sendWithBackPressure(pauseAck);
                this.onPauseEvent();
            }
            else {
                if (!this.fileMetadataList || this.fileMetadataList.length <= 0)
                    throw new Error("file metadata list not initialized properly");
                const pauseAck = new Uint8Array(1 + 1);
                let offset = 0;
                pauseAck[offset] = DataType.FilePauseAck;
                offset++;
                pauseAck[offset] = fileId;
                offset++;
                await this.sendWithBackPressure(pauseAck);
            }
        }
    }
    getFileIdWorker(fileId) {
        return this.workersFileMap.find((wfm) => wfm.fileId === fileId)?.worker;
    }
    onPauseEvent() {
        if (!this.fileMetadataList || this.fileMetadataList.length <= 0)
            throw new Error("file metadata list not initialized properly");
        this.fileMetadataList.map(fml => fml.fileId).forEach((fi) => {
            const workerForId = this.getFileIdWorker(fi);
            if (!workerForId)
                throw new Error(`main -> no worker for fileId ${fi} found`);
            console.log(this.isPaused(fi), "here");
            if (this.isPaused(fi) === true) {
                const pauseReq = {
                    action: WorkerAction.Pause,
                    payload: { fileId: fi },
                };
                workerForId.postMessage(pauseReq);
            }
            else if (this.isPaused(fi) === false) {
                const resumeReq = {
                    action: WorkerAction.Resume,
                    payload: { fileId: fi },
                };
                workerForId.postMessage(resumeReq);
            }
        });
    }
    onFileDownload(fileId) {
        return this.fileHandlesForDownload.get(fileId);
    }
    async initWorkers() {
        if (!this.fileMetadataList || this.fileMetadataList.length <= 0)
            throw new Error("File Metadata list not initialized properly.");
        this.workersFileMap = this.fileMetadataList.map((fl) => ({
            worker: new Worker(new URL("./workers/index.worker.js", import.meta.url), { type: "module" }),
            fileId: fl.fileId
        }));
        let initWrittenFileIds = new Array(this.workersFileMap.length).fill(false);
        this.workersFileMap.forEach(async (wfm) => {
            if (!this.unwrappedLocalTransferKey || !this.unwrappedRemoteTransferKey)
                throw new Error("local, remote transfer keys not properly initialized for workers");
            const { worker, fileId } = wfm;
            const fileMetadataForId = this.fileMetadataList?.find((fml) => fml.fileId === fileId);
            if (!fileMetadataForId)
                throw new Error(`Cant find metadata for file with id: ${fileId}`);
            worker.addEventListener("message", async (ev) => {
                const { action, status, result, error } = ev.data;
                switch (action) {
                    case WorkerAction.InitEncryption: {
                        if (status === "SUCCESS" && result) {
                            if (!result.start)
                                return;
                            this.emit("progress", { fileId, progressRatio: 0, speed: 0, timeLeft: 0, of: "Uploading", reset: true });
                            const nextChunkReq = {
                                action: WorkerAction.InitGetChunks,
                                payload: { fileId: fileId },
                            };
                            worker.postMessage(nextChunkReq);
                        }
                        break;
                    }
                    case WorkerAction.GetNextChunk: {
                        if (status === "SUCCESS" && result) {
                            const { packet, chunkId, fileId, isLastChunk } = result;
                            this.speedCalc.addSample(packet?.byteLength ?? 0);
                            if (isLastChunk || chunkId % Math.floor(fileMetadataForId.totalChunks / 100) === 0) {
                                this.emit("progress", {
                                    fileId,
                                    speed: this.speedCalc.getCurrentSpeed(),
                                    progressRatio: (isLastChunk ? fileMetadataForId.totalChunks : chunkId + 1) / fileMetadataForId.totalChunks,
                                    timeLeft: (isLastChunk ?
                                        0 :
                                        fileMetadataForId.totalChunks * PeerTransfer.CHUNK_SIZE - (chunkId + 1) * PeerTransfer.CHUNK_SIZE)
                                        / this.speedCalc.recentSpeed,
                                    of: "Uploading",
                                });
                            }
                            if (packet) {
                                await this.sendWithBackPressure(new Uint8Array(packet), () => {
                                    const bufferPauseReq = {
                                        action: WorkerAction.BackpressurePause,
                                        payload: {
                                            fileId: fileId,
                                        }
                                    };
                                    worker.postMessage(bufferPauseReq);
                                }, () => {
                                    const bufferResumeReq = {
                                        action: WorkerAction.BackpressureResume,
                                        payload: {
                                            fileId: fileId,
                                        }
                                    };
                                    worker.postMessage(bufferResumeReq);
                                });
                            }
                            if (isLastChunk) {
                                const packet = new Uint8Array(2);
                                packet[0] = DataType.ChunkSendComplete;
                                packet[1] = fileId;
                                this.onSendData(DataType.ChunkSendComplete, packet);
                                return;
                            }
                        }
                        break;
                    }
                    case WorkerAction.SetIncomingChunk: {
                        if (status === "SUCCESS" && result) {
                            const { fileId, chunkId, bytesWritten } = result;
                            this.emit("progress", {
                                fileId,
                                speed: this.speedCalc.getCurrentSpeed(),
                                progressRatio: bytesWritten / fileMetadataForId.fileSize,
                                timeLeft: (fileMetadataForId.fileSize - bytesWritten) / this.speedCalc.recentSpeed,
                                of: "Downloading",
                            });
                        }
                        break;
                    }
                    case WorkerAction.GetBitmap: {
                        if (status === "SUCCESS" && result) {
                            const { packet, fileId } = result;
                            this.onSendData(DataType.RetryChunks, new Uint8Array(packet));
                        }
                        break;
                    }
                    case WorkerAction.RetryMissingChunks: {
                        if (status === "SUCCESS" && result) {
                            const { fileId } = result;
                            const nextChunkReq = {
                                action: WorkerAction.InitEncryption,
                                payload: { fileId: fileId, chunkId: 0, start: true },
                            };
                            worker.postMessage(nextChunkReq);
                        }
                        break;
                    }
                    case WorkerAction.GetFileHash: {
                        if (status === "SUCCESS" && result) {
                            const { fileId, hash } = result;
                            if (this.peerType === PeerType.Sender) {
                                if (!this.localSigKeys || !this.unwrappedLocalTransferKey)
                                    throw new Error("local signature keys and/or local transfer key not initialized properly");
                                const packet = await encodeAndEncryptFileHashWithSignature(fileId, hash, this.localSigKeys.privateKey, this.unwrappedLocalTransferKey);
                                this.onSendData(DataType.FileHash, packet, fileId);
                            }
                            else {
                                this.localFileHash.set(fileId, hash);
                                const isValid = this.remoteFileHash.get(fileId) === hash;
                                if (this.remoteFileHash.get(fileId)) {
                                    this.emit("isFileValid", {
                                        fileId: fileId,
                                        isValid: isValid
                                    });
                                }
                                if (isValid) {
                                    const getFileDwnldReq = {
                                        action: WorkerAction.GetFileDownload,
                                        payload: {
                                            fileId: fileId,
                                        }
                                    };
                                    worker.postMessage(getFileDwnldReq);
                                }
                            }
                        }
                        break;
                    }
                    case WorkerAction.InitWritable: {
                        if (status === "SUCCESS" && result) {
                            const fileId = result.fileId;
                            initWrittenFileIds[fileId] = true;
                            if (initWrittenFileIds.every(iwf => iwf))
                                this.onSendData(DataType.FileListMetadataAck);
                        }
                        break;
                    }
                    case WorkerAction.GetFileDownload: {
                        if (status === "SUCCESS" && result) {
                            const { fileId, fileName } = result;
                            this.fileHandlesForDownload.set(fileId, fileName);
                        }
                        break;
                    }
                    case WorkerAction.FileHashProgress: {
                        if (status === "SUCCESS" && result) {
                            const { fileId, bytesWritten, chunkSize, start } = result;
                            this.speedCalc.addSample(chunkSize);
                            this.emit("progress", {
                                fileId,
                                progressRatio: bytesWritten / fileMetadataForId.fileSize,
                                speed: this.speedCalc.getCurrentSpeed(),
                                timeLeft: (fileMetadataForId.fileSize - bytesWritten) / this.speedCalc.recentSpeed,
                                of: "Hashing",
                                reset: start,
                            });
                        }
                        break;
                    }
                    default:
                        break;
                }
                if (error) {
                    console.log("worker errors", error);
                }
            });
            worker.addEventListener("error", (evt) => {
                console.error("worker error", evt.error);
            });
            worker.addEventListener("messageerror", (evt) => {
                console.error("worker message error", evt);
            });
            const localTransferKeyReq = {
                action: WorkerAction.GetLocalTransferKey,
                payload: {
                    transferKey: this.unwrappedLocalTransferKey
                }
            };
            const remoteTransferKeyReq = {
                action: WorkerAction.GetRemoteTransferKey,
                payload: {
                    transferKey: this.unwrappedRemoteTransferKey
                }
            };
            worker.postMessage(localTransferKeyReq);
            worker.postMessage(remoteTransferKeyReq);
            if (this.peerType === PeerType.Sender) {
                const fileHandle = this.fileHandleList[fileId];
                if (!fileHandle)
                    throw new Error(`Cant find fileHandle for file id: ${fileId}`);
                const file = (fileHandle instanceof FileSystemFileHandle) ? await fileHandle.getFile() : fileHandle;
                const metadataReq = {
                    action: WorkerAction.GetMetadata,
                    payload: {
                        file: file,
                        fileId: fileId,
                        totalChunks: fileMetadataForId.totalChunks,
                        chunkSize: PeerTransfer.CHUNK_SIZE,
                    }
                };
                worker.postMessage(metadataReq);
                const nextChunkReq = {
                    action: WorkerAction.InitEncryption,
                    payload: { fileId: fileId, chunkId: 0, start: true },
                };
                worker.postMessage(nextChunkReq);
            }
            else if (this.peerType === PeerType.Reciever) {
                const initWritableReq = {
                    action: WorkerAction.InitWritable,
                    payload: {
                        metadata: fileMetadataForId,
                        chunkSize: PeerTransfer.CHUNK_SIZE,
                    }
                };
                worker.postMessage(initWritableReq);
            }
        });
    }
    onUpdateTransferState(to) {
        if (this.transferState === to)
            return;
        switch (to) {
            case TransferState.Start:
                break;
            case TransferState.PublicKeySend:
                this.onSendData(DataType.PublicEncryptionAndSigningKey);
                break;
            case TransferState.PrivacyConfirm:
                this.onSendData(DataType.PrivacyConfirm);
                break;
            case TransferState.TransferKeySend:
                this.onSendData(DataType.TransferKey);
                break;
            case TransferState.FileMetadataSend:
                this.onSendData(DataType.FileListMetadata);
                break;
            case TransferState.FileTrasnferStart:
                if (!this.fileMetadataList || this.fileMetadataList.length <= 0)
                    return;
                this.fileMetadataList.forEach((fml) => this.localFilePause.set(fml.fileId, false));
                this.emit("fileInfo", { files: this.fileMetadataList });
                this.initWorkers();
                break;
        }
    }
    async onSendData(dataType, packet, fileId) {
        switch (dataType) {
            case DataType.PublicEncryptionAndSigningKey:
                this.sendLocalPublicKeys();
                break;
            case DataType.PublicEncrytionAndSigningKeyRecievedAck:
                this.sendAckMessage(dataType);
                break;
            case DataType.PrivacyConfirm:
                this.sendPrivacyConfirm();
                break;
            case DataType.PrivacyConfirmAck:
                this.sendAckMessage(dataType);
                break;
            case DataType.TransferKey:
                this.sendWrappedLocalTransferKey();
                break;
            case DataType.TransferKeyAck:
                this.sendAckMessage(dataType);
                break;
            case DataType.FileListMetadata:
                this.sendFileListMetadata();
                break;
            case DataType.FileListMetadataAck:
                this.sendAckMessage(dataType);
                break;
            case DataType.ChunkSendComplete:
                if (packet) {
                    const fileId = packet[1];
                    this.retryChunksAck.set(fileId, false);
                    this.sendUntilAckTrue(packet, () => {
                        const currFileId = fileId;
                        const hasRecieved = this.retryChunksAck.get(currFileId) ?? false;
                        return hasRecieved;
                    });
                }
                break;
            case DataType.RetryChunks:
                if (packet) {
                    await this.sendWithBackPressure(packet);
                }
                break;
            case DataType.FileHash:
                if (packet && fileId !== undefined) {
                    this.filesHashAck.set(fileId, false);
                    this.sendUntilAckTrue(packet, () => {
                        const currFileId = fileId;
                        const hasRecieved = this.filesHashAck.get(currFileId) ?? false;
                        return hasRecieved;
                    });
                }
                break;
        }
    }
    async onRecieveData(payload) {
        const dataType = payload[0];
        const data = payload.subarray(1);
        // console.log(dataType, "recv");
        switch (dataType) {
            case DataType.PublicEncryptionAndSigningKey:
                this.onPublicKeysRecieved(data);
                break;
            case DataType.PublicEncrytionAndSigningKeyRecievedAck:
                this.publicKeysRecievedAck = true;
                break;
            case DataType.PrivacyConfirm:
                this.onPrivacyConfirmRecieve();
                break;
            case DataType.PrivacyConfirmAck:
                this.privacyConfirmedAck = true;
                if (this.localPrivacyConfirmed && this.remotePrivacyConfirmed && this.privacyConfirmedAck) {
                    this.onUpdateTransferState(TransferState.TransferKeySend);
                }
                break;
            case DataType.TransferKey:
                this.onWrappedTransferKeyRecieved(data);
                break;
            case DataType.TransferKeyAck:
                this.transferKeyRecievedAck = true;
                if (this.peerType === PeerType.Sender) {
                    this.onUpdateTransferState(TransferState.FileMetadataSend);
                }
                break;
            case DataType.FileListMetadata:
                this.onFileListMetadataRecieve(data);
                break;
            case DataType.FileListMetadataAck:
                this.fileMetadataRecievedAck = true;
                this.onUpdateTransferState(TransferState.FileTrasnferStart);
                break;
            case DataType.FileChunk: {
                const fileId = data[4];
                if (this.isPaused(fileId))
                    break;
                this.speedCalc.addSample(payload.length);
                const worker = this.getFileIdWorker(fileId);
                if (worker) {
                    const slicedPayload = data.slice().buffer;
                    const setChunkReq = {
                        action: WorkerAction.SetIncomingChunk,
                        payload: {
                            packet: slicedPayload
                        }
                    };
                    worker.postMessage(setChunkReq, [slicedPayload]);
                }
                break;
            }
            case DataType.ChunkSendComplete: {
                console.log("chunk sent complete");
                const fileId = data[0];
                const worker = this.getFileIdWorker(fileId);
                if (worker) {
                    const getBitmapReq = {
                        action: WorkerAction.GetBitmap,
                        payload: {
                            fileId: fileId,
                        }
                    };
                    worker.postMessage(getBitmapReq);
                }
                break;
            }
            case DataType.RetryChunks: {
                const { fileId, bitmap } = decodeChunksBitmap(data);
                if (this.retryChunksAck.get(fileId))
                    return;
                this.retryChunksAck.set(fileId, true);
                const worker = this.getFileIdWorker(fileId);
                if (!worker)
                    throw new Error("no worker with fileId: " + fileId + " found.");
                if (isBitmapComplete(bitmap)) {
                    const hashReq = {
                        action: WorkerAction.GetFileHash,
                        payload: {
                            fileId: fileId,
                        }
                    };
                    worker.postMessage(hashReq);
                    this.emit("fileUploadComplete", {
                        fileId: fileId,
                    });
                    return;
                }
                const bitmapBuffer = bitmap.buffer;
                const nextChunkReq = {
                    action: WorkerAction.RetryMissingChunks,
                    payload: { fileId: fileId, bitmap: bitmapBuffer },
                };
                worker.postMessage(nextChunkReq, [bitmapBuffer]);
                break;
            }
            case DataType.FileHash: {
                this.onFileHashRecieve(data);
                break;
            }
            case DataType.FileHashAck: {
                const fileId = data[0];
                this.filesHashAck.set(fileId, true);
                break;
            }
            case DataType.TransferPause:
            case DataType.FilePause:
                this.onRemotePause(payload);
                break;
            case DataType.TransferPauseAck: {
                if (this.transferPauseAck)
                    return;
                this.transferPauseAck = true;
                break;
            }
            case DataType.FilePauseAck: {
                let offset = 0;
                const fileId = data[offset];
                offset++;
                if (this.filePauseAck.get(fileId))
                    return;
                this.filePauseAck.set(fileId, true);
                break;
            }
        }
    }
    async sendLocalPublicKeys() {
        if (!this.localEncKeys)
            this.localEncKeys = await generateEncryptionKeyPair();
        if (!this.localSigKeys)
            this.localSigKeys = await generateSigningKeyPair();
        const publicEncKeyBuff = await exportPublicKeyToBinary(this.localEncKeys.publicKey);
        const publicSigKeyBuff = await exportPublicKeyToBinary(this.localSigKeys.publicKey);
        const packetBuffer = encodePublicKeys(publicEncKeyBuff, publicSigKeyBuff);
        this.sendUntilAckTrue(packetBuffer, () => this.publicKeysRecievedAck);
    }
    async onPublicKeysRecieved(payload) {
        let offset = 0;
        const encKeyLen = 294;
        const sigKeyLen = 91;
        if (payload.length !== encKeyLen + sigKeyLen)
            throw new Error("public keys payload arrived missmatched");
        const encKeyBuff = payload.subarray(offset, encKeyLen + offset);
        offset += encKeyLen;
        const sigKeyBuff = payload.subarray(offset, sigKeyLen + offset);
        this.remoteEncPublicKey = await importEncryptionPublicKey(encKeyBuff);
        this.remoteSigPublicKey = await importSigningPublicKey(sigKeyBuff);
        this.onSendData(DataType.PublicEncrytionAndSigningKeyRecievedAck);
        await this.displaySafetyNum(payload);
    }
    async displaySafetyNum(remotePubKeys) {
        if (!this.localEncKeys || !this.localSigKeys)
            throw new Error("Public keys not initialized properly");
        const localEncKeyBuff = await exportPublicKeyToBinary(this.localEncKeys.publicKey);
        const localSigKeyBuff = await exportPublicKeyToBinary(this.localSigKeys.publicKey);
        const localPubKeys = new Uint8Array(localEncKeyBuff.length + localSigKeyBuff.length);
        let offset = 0;
        localPubKeys.set(localEncKeyBuff, offset);
        offset += localEncKeyBuff.length;
        localPubKeys.set(localSigKeyBuff, offset);
        const safetyCode = this.peerType === PeerType.Sender ?
            await generateSafetyNumber(localPubKeys, remotePubKeys) :
            await generateSafetyNumber(remotePubKeys, localPubKeys);
        this.emit("safetyCode", { value: safetyCode });
    }
    onPrivaryPopoverConfirm(isSecure) {
        this.onUpdateTransferState(TransferState.PrivacyConfirm);
    }
    sendPrivacyConfirm() {
        this.localPrivacyConfirmed = true;
        const packet = new Uint8Array(1);
        packet[0] = DataType.PrivacyConfirm;
        this.sendUntilAckTrue(packet, () => this.privacyConfirmedAck);
    }
    onPrivacyConfirmRecieve() {
        this.remotePrivacyConfirmed = true;
        this.onSendData(DataType.PrivacyConfirmAck);
        if (this.localPrivacyConfirmed && this.remotePrivacyConfirmed && this.privacyConfirmedAck) {
            this.onUpdateTransferState(TransferState.TransferKeySend);
        }
    }
    async sendWrappedLocalTransferKey() {
        if (!this.remoteEncPublicKey)
            throw new Error("remote encryption public keys not found");
        if (!this.unwrappedLocalTransferKey) {
            this.unwrappedLocalTransferKey = await generateTemporaryTransferKey();
        }
        const wrappedLocalTransferKey = await lockTransferKeyWithRemotePublicKey(this.unwrappedLocalTransferKey, this.remoteEncPublicKey);
        const packetBuffer = encodeWrappedTransferKey(wrappedLocalTransferKey);
        this.sendUntilAckTrue(packetBuffer, () => this.transferKeyRecievedAck);
    }
    async onWrappedTransferKeyRecieved(payload) {
        if (!this.localEncKeys)
            throw new Error("Local encryption keys not initialized.");
        this.unwrappedRemoteTransferKey = await unlockTransferKeyWithPrivateKey(payload, this.localEncKeys.privateKey);
        this.onSendData(DataType.TransferKeyAck);
    }
    async sendFileListMetadata() {
        const metadataList = [];
        for (const [index, fileHandle] of this.fileHandleList.entries()) {
            let fileObj = (fileHandle instanceof FileSystemFileHandle) ?
                await fileHandle.getFile() : fileHandle;
            const fileId = index;
            const fileName = fileObj.name;
            const fileSize = fileObj.size;
            const fileType = fileObj.type;
            const totalChunks = Math.ceil(fileSize / PeerTransfer.CHUNK_SIZE);
            metadataList.push({ fileId, fileName, fileSize, fileType, totalChunks });
        }
        this.fileMetadataList = metadataList;
        if (!this.localSigKeys || !this.unwrappedLocalTransferKey)
            throw new Error("local signing keys and local transfer key not initialized properly");
        const packet = await encodeAndEncryptFileMatadataWithSignature(this.fileMetadataList, this.localSigKeys.privateKey, this.unwrappedLocalTransferKey);
        this.sendUntilAckTrue(packet, () => this.fileMetadataRecievedAck);
    }
    async onFileListMetadataRecieve(payload) {
        if (!this.remoteSigPublicKey || !this.unwrappedRemoteTransferKey)
            throw new Error("Remote Signature public key or/and remote transfer key not initialized properly");
        const metadataList = await verifyDecryptAndDecodeFileMetadata(payload, this.remoteSigPublicKey, this.unwrappedRemoteTransferKey);
        this.fileMetadataList = metadataList;
        // this.onSendData(DataType.FileListMetadataAck);
        this.onUpdateTransferState(TransferState.FileTrasnferStart);
    }
    async sendAckMessage(ackDataType) {
        const totalBufferLength = 1;
        const packetBuffer = new Uint8Array(totalBufferLength);
        let byteOffset = 0;
        const dataTypeValue = ackDataType;
        packetBuffer[byteOffset] = dataTypeValue;
        byteOffset++;
        await this.sendWithBackPressure(packetBuffer);
    }
    async onFileHashRecieve(payload) {
        const outFileId = payload[0];
        if (this.remoteFileHash.get(outFileId))
            return;
        try {
            if (!this.remoteSigPublicKey || !this.unwrappedRemoteTransferKey)
                throw new Error("remote public signature key and/or remote transfer key not initialized properly.");
            const { fileId, hash } = await verifyDecryptAndDecodeFileHash(payload, this.remoteSigPublicKey, this.unwrappedRemoteTransferKey);
            this.remoteFileHash.set(fileId, hash);
            // emit is verifying hash and check hash in worker
            this.emit("isHashing", {
                fileId: fileId,
            });
            if (this.localFileHash.get(fileId)) {
                const isValid = this.localFileHash.get(fileId) === hash;
                this.emit("isFileValid", {
                    fileId: fileId,
                    isValid: isValid
                });
                if (isValid) {
                    const getFileDwnldReq = {
                        action: WorkerAction.GetFileDownload,
                        payload: {
                            fileId: fileId,
                        }
                    };
                    this.getFileIdWorker(fileId)?.postMessage(getFileDwnldReq);
                }
            }
        }
        catch (err) {
            console.error(err);
        }
        finally {
            const ackPacket = new Uint8Array(2);
            ackPacket[0] = DataType.FileHashAck;
            ackPacket[1] = outFileId;
            await this.sendWithBackPressure(ackPacket);
        }
    }
    async sendUntilAckTrue(payload, checkAck) {
        if (!this.dataChannel)
            throw new Error("Data channels not initialized properly");
        if (payload.byteLength <= 0)
            throw new Error("Data payload empty");
        let retries = 0;
        const MAX_RETRIES = 20;
        while (retries < MAX_RETRIES) {
            if (checkAck())
                return;
            if (this.dataChannel.readyState !== "open")
                throw new Error("Connect not open");
            await this.sendWithBackPressure(payload);
            const delay = 500 * (retries + 1);
            await new Promise((r) => setTimeout(r, delay));
            retries++;
        }
        throw new Error("Ack timeout");
    }
    async waitForBufferedAmountLow() {
        if (!this.dataChannel)
            throw new Error("Data channels not initialized properly");
        if (this.dataChannel.bufferedAmount <=
            this.dataChannel.bufferedAmountLowThreshold) {
            return;
        }
        return new Promise((resolve) => {
            if (!this.dataChannel)
                throw new Error("Data channels not initialized properly");
            const handler = () => {
                if (!this.dataChannel)
                    throw new Error("Data channels not initialized properly");
                this.dataChannel.removeEventListener("bufferedamountlow", handler);
                resolve();
            };
            this.dataChannel.addEventListener("bufferedamountlow", handler);
        });
    }
    async sendWithBackPressure(data, onBufferHigh, onBufferLow) {
        if (!this.dataChannel)
            throw new Error("Data channel not initialized");
        if (this.dataChannel.bufferedAmount > PeerTransfer.MAX_BUFFER) {
            onBufferHigh?.();
            await this.waitForBufferedAmountLow();
            onBufferLow?.();
        }
        this.dataChannel.send(data);
    }
}
PeerTransfer.MAX_BUFFER = 8 * 1024 * 1024;
PeerTransfer.MIN_BUFFER = 4 * 1024 * 1024;
PeerTransfer.CHUNK_SIZE = 128 * 1024;
function encodePublicKeys(publicEncKeyBuff, publicSigKeyBuff) {
    const totalBufferLength = 1 + publicEncKeyBuff.length + publicSigKeyBuff.length;
    const packetBuffer = new Uint8Array(totalBufferLength);
    let byteOffset = 0;
    const dataTypeValue = DataType.PublicEncryptionAndSigningKey;
    packetBuffer[byteOffset] = dataTypeValue;
    byteOffset++;
    packetBuffer.set(publicEncKeyBuff, byteOffset);
    byteOffset += publicEncKeyBuff.length;
    packetBuffer.set(publicSigKeyBuff, byteOffset);
    return packetBuffer;
}
function encodeWrappedTransferKey(wrappedTransferKey) {
    const totalBufferLenght = 1 + wrappedTransferKey.length;
    const packetBuffer = new Uint8Array(totalBufferLenght);
    let byteOffset = 0;
    const dataTypeValue = DataType.TransferKey;
    packetBuffer[byteOffset] = dataTypeValue;
    byteOffset++;
    packetBuffer.set(wrappedTransferKey, byteOffset);
    return packetBuffer;
}
export function encodeFileMetadataList(fileMetadataList) {
    const stringEncoder = new TextEncoder();
    const encodedFiles = [];
    let totalSize = 0;
    for (const metadata of fileMetadataList) {
        const { fileId, fileSize, fileType, fileName, totalChunks } = metadata;
        const encodedFileType = stringEncoder.encode(fileType);
        const encodedFileName = stringEncoder.encode(fileName);
        // ID(1) + TotalChunks(4) + FileSize(8) + TypeLen(1) + NameLen(1) + Strings
        const entrySize = 1 + 4 + 8 + 1 + 1 + encodedFileType.length + encodedFileName.length;
        const filePacket = new Uint8Array(entrySize);
        let offset = 0;
        // 1. File ID
        filePacket[offset] = fileId;
        offset += 1;
        // 4. Total Chunks (4 bytes)
        setUint32BE(filePacket, offset, totalChunks);
        offset += 4;
        // 5. File Size (8 bytes)
        setBigUint64BE(filePacket, offset, BigInt(fileSize));
        offset += 8;
        // 6. File Type Length + Data
        filePacket[offset] = encodedFileType.length;
        offset += 1;
        filePacket.set(encodedFileType, offset);
        offset += encodedFileType.length;
        // 7. File Name Length + Data
        filePacket[offset] = encodedFileName.length;
        offset += 1;
        filePacket.set(encodedFileName, offset);
        offset += encodedFileName.length;
        encodedFiles.push(filePacket);
        totalSize += entrySize;
    }
    const finalBuffer = new Uint8Array(totalSize);
    let mainOffset = 0;
    for (const fileBuffer of encodedFiles) {
        finalBuffer.set(fileBuffer, mainOffset);
        mainOffset += fileBuffer.length;
    }
    return finalBuffer;
}
export async function encodeAndEncryptFileMatadataWithSignature(fileMetadataList, localSigPrivateKey, localTransferKey) {
    const encodedFileMetadata = encodeFileMetadataList(fileMetadataList);
    const { iv, ciphertext: encryptedData } = await encryptData(encodedFileMetadata, localTransferKey);
    const signatureBuffer = await createSignature(encryptedData, localSigPrivateKey);
    const packetBuffer = new Uint8Array(1 + signatureBuffer.length + iv.length + encryptedData.length);
    let offset = 0;
    packetBuffer[offset] = DataType.FileListMetadata;
    offset++;
    packetBuffer.set(signatureBuffer, offset);
    offset += signatureBuffer.length;
    packetBuffer.set(iv, offset);
    offset += iv.length;
    packetBuffer.set(encryptedData, offset);
    return packetBuffer;
}
export async function verifyDecryptAndDecodeFileMetadata(payload, remoteSigPubKey, unwrappedRemoteTransferKey) {
    // signature 64 bytes and iv 12 bytes
    let offset = 0;
    const signatureLen = 64;
    const ivLen = 12;
    const signature = payload.subarray(offset, offset + signatureLen);
    offset += signature.length;
    const iv = payload.subarray(offset, offset + ivLen);
    offset += iv.length;
    const data = payload.subarray(offset);
    const isVaild = await verifySignature(data, signature, remoteSigPubKey);
    if (!isVaild)
        throw new Error("The file metadata not valid");
    const decryptedData = await decryptData(data, iv, unwrappedRemoteTransferKey);
    const stringDecoder = new TextDecoder();
    const metadataList = [];
    offset = 0;
    while (offset < decryptedData.length) {
        // 1. File ID
        const fileId = decryptedData[offset];
        offset += 1;
        const totalChunks = getUint32BE(decryptedData, offset);
        offset += 4;
        const fileSize = Number(getBigUint64BE(decryptedData, offset));
        offset += 8;
        // 6. File Type Length + Data
        const typeLen = decryptedData[offset];
        offset += 1;
        const fileType = stringDecoder.decode(decryptedData.subarray(offset, offset + typeLen));
        offset += typeLen;
        // 7. File Name Length + Data
        const fileNameLen = decryptedData[offset];
        offset += 1;
        const fileName = stringDecoder.decode(decryptedData.subarray(offset, offset + fileNameLen));
        ;
        offset += fileNameLen;
        metadataList.push({ fileId, totalChunks, fileSize, fileType, fileName });
    }
    return metadataList;
}
export function encodeChunksBitmap(fileId, totalChunks, bitmap) {
    const totalBufferLen = 1 + 1 + 4 + bitmap.length;
    const packet = new Uint8Array(totalBufferLen);
    let offset = 0;
    packet[offset] = DataType.RetryChunks;
    offset++;
    packet[offset] = fileId;
    offset++;
    setUint32BE(packet, offset, totalChunks);
    offset += 4;
    packet.set(bitmap, offset);
    offset += bitmap.length;
    return packet;
}
export function decodeChunksBitmap(packet) {
    let offset = 0;
    const fileId = packet[offset];
    offset++;
    const totaChunks = getUint32BE(packet, offset);
    offset += 4;
    const bitmap = packet.slice(offset);
    offset += bitmap.length;
    // const missingChunks = getMissingChunks(bitmap, totaChunks);
    return {
        fileId,
        bitmap,
    };
}
export async function encodeAndEncryptFileHashWithSignature(fileId, hash, localSigPrivateKey, localTransferKey) {
    const stringEncoder = new TextEncoder();
    const encodedHashStr = stringEncoder.encode(hash);
    const encodedData = new Uint8Array(1 + encodedHashStr.length);
    let offset = 0;
    encodedData[offset] = fileId;
    offset++;
    encodedData.set(encodedHashStr, offset);
    const { iv, ciphertext: encryptedData } = await encryptData(encodedData, localTransferKey);
    const signatureBuffer = await createSignature(encryptedData, localSigPrivateKey);
    const packet = new Uint8Array(1 + 1 + signatureBuffer.length + iv.length + encryptedData.length);
    offset = 0;
    packet[offset] = DataType.FileHash;
    offset++;
    packet[offset] = fileId;
    offset++;
    packet.set(signatureBuffer, offset);
    offset += signatureBuffer.length;
    packet.set(iv, offset);
    offset += iv.length;
    packet.set(encryptedData, offset);
    offset += encryptedData.length;
    return packet;
}
export async function verifyDecryptAndDecodeFileHash(payload, remoteSigPubKey, unwrappedRemoteTransferKey) {
    // signature 64 bytes and iv 12 bytes
    let offset = 0;
    const signatureLen = 64;
    const ivLen = 12;
    const outFileId = payload[offset];
    offset++;
    const signature = payload.subarray(offset, offset + signatureLen);
    offset += signature.length;
    const iv = payload.subarray(offset, offset + ivLen);
    offset += iv.length;
    const data = payload.subarray(offset);
    const isVaild = await verifySignature(data, signature, remoteSigPubKey);
    if (!isVaild)
        throw new Error("The file hash not valid");
    const decryptedData = await decryptData(data, iv, unwrappedRemoteTransferKey);
    const stringDecoder = new TextDecoder();
    offset = 0;
    const fileId = decryptedData[offset];
    offset++;
    const hash = stringDecoder.decode(decryptedData.subarray(offset));
    if (outFileId !== fileId)
        throw new Error("file Ids not matches on packet");
    return {
        fileId,
        hash,
    };
}
