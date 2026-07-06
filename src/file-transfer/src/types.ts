// export enum ConnectionType {
//     Local,
//     Global,
// }

export enum PeerType {
    Sender,
    Reciever,
}

export enum ViewPage {
    TransferLanding,
    FilesUpload,
    CreateRoom,
    JoinRoom,
    FilesTransfer,
}

export enum CompressionType {
  Zstd = "zstd",
  Brotli = "brotli",
  Deflate = "deflate",
  DeflateRaw = "deflate-raw",
  Gzip = "gzip",
  None = "none",
}

export type Sample = { time: number; bytes: number };

export enum DataType {
  PublicEncryptionAndSigningKey = 0,
  PublicEncrytionAndSigningKeyRecievedAck = 1,
  PrivacyConfirm = 2,
  PrivacyConfirmAck = 3,
  TransferKey = 4,
  TransferKeyAck = 5,
  FileListMetadata = 6,
  FileListMetadataAck = 7,
  FileChunk = 8,
  BytesWritten = 9,
  ChunkSendComplete = 10,
  RetryChunks = 11,
  FileHash = 12,
  FileHashAck = 13,
  RetryChunksAck = 14,
  TransferComplete = 15,
  TransferPause = 16,
  TransferPauseAck = 17,
  FilePause = 18,
  FilePauseAck = 19,
}

export enum TransferState {
  Start,
  PublicKeySend,
  PrivacyConfirm,
  TransferKeySend,
  FileMetadataSend,
  FileTrasnferStart,
}

export interface FileMetadata {
    fileId: number;
    fileSize: number;
    totalChunks: number;
    fileName: string;
    fileType: string;
}

export type ChunkPayload = {
  chunkId: number;
  fileId: number;
  ciphertext: Uint8Array;
  iv: Uint8Array;
};

export interface SenderFileRecord {
  id: number;
  fileMetadata: FileMetadata;
  fileHandle: FileSystemFileHandle | File;
  ephemeralKeyPair: CryptoKeyPair;
  leafHashes: Uint8Array;
}

export enum StatusType {
  RecipientEncryptionKey = 0,
  SenderSigningKey = 1,
  Complete = 2,
  FileInfo = 3,
  Pause = 4,
}

export type Status = 
  | { type: StatusType.RecipientEncryptionKey; ok: boolean }
  | { type: StatusType.SenderSigningKey; ok: boolean }
  | { type: StatusType.Complete; ok: boolean }
  | { type: StatusType.FileInfo; ok: boolean }
  | { type: StatusType.Pause; ok: boolean; reason?: string };

export type PauseStatus = {
  pause: boolean;
  from: "sender" | "reciever";
  resumeFromFileId: number;
  resumeFromChunkId: number;
};

export interface ChunkAck {
    fileId: number;
    chunkId: number;
}

export enum DataPayloadType {
  SenderSigningKey = 0,
  RecipientEncryptionKey = 1,
  FileInfo = 2,
  Status = 3,
  Chunk = 4,
  ChunkAck = 5,
  PauseInfo = 6,
}

export type DataPayload =
  | { type: DataPayloadType.SenderSigningKey; data: Uint8Array } // Changed to Uint8Array for WebRTC
  | { type: DataPayloadType.RecipientEncryptionKey; data: Uint8Array }
  | { type: DataPayloadType.FileInfo; data: FileMetadata[] }
  | { type: DataPayloadType.Status; data: Status }
  | { type: DataPayloadType.Chunk; data: ChunkPayload }
  | { type: DataPayloadType.ChunkAck; data: ChunkAck }
  | { type: DataPayloadType.PauseInfo; data: PauseStatus };

export enum RecieveState {
    Idel,
    Connecting,
    Handshaking,
    Recieveing,
    Paused,
    Retry,
    Completed,
    Closed,
}

export interface FileTransferState {
  fileId: number;
  state: "Uploading" | "Downloading" | "LocalPause" | "RemotePause" | "Hashing" | "Retrying"; 
}

export interface TransferEvents {
  stateChange: {
    state: TransferState | RecieveState;
  };

  fileState: FileTransferState;

  offer: {
    value: string;
  };

  answer: {
    value: string;
  };

  senderCandidates: {
    value: string;
  };

  recieverCandidates: {
    value: string;
  };

  safetyCode: {
    value: string;
  }

  fileInfo: {
    files: FileMetadata[];
  };

  progress: {
    fileId: number;
    progressRatio: number;
    speed: number;
    timeLeft: number;
    of: "Hashing" | "Downloading" | "Uploading"
    reset?: boolean;
  };

  fileUploadComplete: {
    fileId: number;
  }

  isHashing: {
    fileId: number;
  };

  isFileValid: {
    fileId: number;
    isValid: boolean;
  };

  downloadReady: {
    fileId: number;
    fileHandle: FileSystemFileHandle;
  }

  transferPause: {
    by: "local" | "remote";
    paused: boolean;
  };

  filePause: {
    by: "local" | "remote";
    fileId: number;
    paused: boolean;
  }

  retry: {
    missingChunks: number;
  };

  complete: void | {opfs: FileSystemDirectoryHandle};

  error: Error;

  closed: {
    isClosed: true;
  };
}

export enum WorkerAction {
    GetLocalTransferKey,
    GetRemoteTransferKey,
    GetMetadata,
    InitWritable,
    InitEncryption,
    InitGetChunks,
    GetNextChunk,
    SetIncomingChunk,
    GetBitmap,
    RetryMissingChunks,
    GetFileHash,
    FileHashProgress,
    GetFileDownload,
    NextChunkReady,
    Pause,
    Resume,
    BackpressurePause,
    BackpressureResume,
    SendForRetry,
}

export type WorkerRequest = {action: WorkerAction.GetLocalTransferKey; payload: {transferKey: CryptoKey}}
                          | {action: WorkerAction.GetRemoteTransferKey; payload: {transferKey: CryptoKey}}
                          | {action: WorkerAction.GetMetadata; payload: {file: File, fileId: number, chunkSize: number, totalChunks: number}}
                          | {action: WorkerAction.InitWritable; payload: {metadata: FileMetadata; chunkSize: number}}
                          | {action: WorkerAction.InitEncryption; payload: {fileId: number, chunkId: number, start: boolean}}
                          | {action: WorkerAction.InitGetChunks; payload: {fileId: number}}
                          | {action: WorkerAction.SetIncomingChunk; payload: {packet: ArrayBuffer}}
                          | {action: WorkerAction.GetBitmap; payload: {fileId: number}}
                          | {action: WorkerAction.RetryMissingChunks; payload: {fileId: number; bitmap: ArrayBuffer}}
                          | {action: WorkerAction.GetFileHash; payload: {fileId: number;}}
                          | {action: WorkerAction.GetFileDownload; payload: {fileId: number;}}
                          | {action: WorkerAction.Pause; payload: {fileId: number}}
                          | {action: WorkerAction.Resume; payload: {fileId: number}}
                          | {action: WorkerAction.BackpressurePause; payload: {fileId: number}}
                          | {action: WorkerAction.BackpressureResume; payload: {fileId: number}}

export type WorkerResponse = {action: WorkerAction.GetNextChunk; status: 'SUCCESS' | 'ERROR'; result?: {packet: ArrayBuffer | null, chunkId: number, fileId: number, isLastChunk: boolean}; error?: string}
                           | {action: WorkerAction.InitEncryption; status: 'SUCCESS' | 'ERROR'; result?: {fileId: number, start: boolean}, error?: string}
                           | {action: WorkerAction.InitWritable; status: 'SUCCESS' | 'ERROR'; result?: {fileId: number}, error?: string}
                           | {action: WorkerAction.SetIncomingChunk; status: 'SUCCESS' | 'ERROR'; result?: {chunkId: number, fileId: number, bytesWritten: number}, error?: string}
                           | {action: WorkerAction.GetBitmap; status: 'SUCCESS' | 'ERROR'; result?: {packet: ArrayBuffer, fileId: number}, error?: string}
                           | {action: WorkerAction.RetryMissingChunks; status: 'SUCCESS' | 'ERROR'; result?: {fileId: number}, error?: string}
                           | {action: WorkerAction.GetFileHash; status: 'SUCCESS' | 'ERROR'; result?: {fileId: number, hash: string}, error?: string}
                           | {action: WorkerAction.FileHashProgress; status: 'SUCCESS' | 'ERROR'; result?: {fileId: number, bytesWritten: number, chunkSize: number, start?: boolean}, error?: string}
                           | {action: WorkerAction.GetFileDownload; status: 'SUCCESS' | 'ERROR'; result?: {fileId: number, file: FileSystemFileHandle}, error?: string}
                           | {action: WorkerAction.NextChunkReady; status: undefined; result: undefined, error: undefined}
                           | {action: WorkerAction.SendForRetry; status: undefined; result: undefined, error: undefined}

export interface FileMetadataPayload {
  fileHandleList: FileSystemFileHandle[] | File[],
  signingKeyPair: CryptoKeyPair;
}

export interface WSEvents {
  roomCreate: {
    code: string;
  };

  roomJoin: {
    code: string;
  };

  roomJoining: null;

  error: Error;

  closed: {
    isClosed: true;
  };

  answer: {
    value: string;
  };

  recieverCandidates: {
    value: string | string[];
  };

  offer: {
    value: string;
  };

  senderCandidates: {
    value: string | string[];
  };
}

export type WSMessageEvent = {
  type: WSMessageType.Init;
  offer: string;
  answer: string;
  senderCandidates: string[];
  recieverCandidates: string[];
} | {
  type: WSMessageType.Offer;
  offer: string;
} | {
  type: WSMessageType.Answer;
  answer: string;
} | {
  type: WSMessageType.senderCandidates;
  senderCandidates: string;
} | {
  type: WSMessageType.recieverCandidates;
  recieverCandidates: string;
};

export enum WSMessageType {
  Init = "init",
  Offer = "offer",
  Answer = "answer",
  senderCandidates = "sender-candidates",
  recieverCandidates = "reciever-candidates",
}