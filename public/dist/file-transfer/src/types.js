// export enum ConnectionType {
//     Local,
//     Global,
// }
export var PeerType;
(function (PeerType) {
    PeerType[PeerType["Sender"] = 0] = "Sender";
    PeerType[PeerType["Reciever"] = 1] = "Reciever";
})(PeerType || (PeerType = {}));
export var ViewPage;
(function (ViewPage) {
    ViewPage[ViewPage["TransferLanding"] = 0] = "TransferLanding";
    ViewPage[ViewPage["FilesUpload"] = 1] = "FilesUpload";
    ViewPage[ViewPage["CreateRoom"] = 2] = "CreateRoom";
    ViewPage[ViewPage["JoinRoom"] = 3] = "JoinRoom";
    ViewPage[ViewPage["FilesTransfer"] = 4] = "FilesTransfer";
})(ViewPage || (ViewPage = {}));
export var CompressionType;
(function (CompressionType) {
    CompressionType["Zstd"] = "zstd";
    CompressionType["Brotli"] = "brotli";
    CompressionType["Deflate"] = "deflate";
    CompressionType["DeflateRaw"] = "deflate-raw";
    CompressionType["Gzip"] = "gzip";
    CompressionType["None"] = "none";
})(CompressionType || (CompressionType = {}));
export var DataType;
(function (DataType) {
    DataType[DataType["PublicEncryptionAndSigningKey"] = 0] = "PublicEncryptionAndSigningKey";
    DataType[DataType["PublicEncrytionAndSigningKeyRecievedAck"] = 1] = "PublicEncrytionAndSigningKeyRecievedAck";
    DataType[DataType["PrivacyConfirm"] = 2] = "PrivacyConfirm";
    DataType[DataType["PrivacyConfirmAck"] = 3] = "PrivacyConfirmAck";
    DataType[DataType["TransferKey"] = 4] = "TransferKey";
    DataType[DataType["TransferKeyAck"] = 5] = "TransferKeyAck";
    DataType[DataType["FileListMetadata"] = 6] = "FileListMetadata";
    DataType[DataType["FileListMetadataAck"] = 7] = "FileListMetadataAck";
    DataType[DataType["FileChunk"] = 8] = "FileChunk";
    DataType[DataType["BytesWritten"] = 9] = "BytesWritten";
    DataType[DataType["ChunkSendComplete"] = 10] = "ChunkSendComplete";
    DataType[DataType["RetryChunks"] = 11] = "RetryChunks";
    DataType[DataType["FileHash"] = 12] = "FileHash";
    DataType[DataType["FileHashAck"] = 13] = "FileHashAck";
    DataType[DataType["RetryChunksAck"] = 14] = "RetryChunksAck";
    DataType[DataType["TransferComplete"] = 15] = "TransferComplete";
    DataType[DataType["TransferPause"] = 16] = "TransferPause";
    DataType[DataType["TransferPauseAck"] = 17] = "TransferPauseAck";
    DataType[DataType["FilePause"] = 18] = "FilePause";
    DataType[DataType["FilePauseAck"] = 19] = "FilePauseAck";
})(DataType || (DataType = {}));
export var TransferState;
(function (TransferState) {
    TransferState[TransferState["Start"] = 0] = "Start";
    TransferState[TransferState["PublicKeySend"] = 1] = "PublicKeySend";
    TransferState[TransferState["PrivacyConfirm"] = 2] = "PrivacyConfirm";
    TransferState[TransferState["TransferKeySend"] = 3] = "TransferKeySend";
    TransferState[TransferState["FileMetadataSend"] = 4] = "FileMetadataSend";
    TransferState[TransferState["FileTrasnferStart"] = 5] = "FileTrasnferStart";
})(TransferState || (TransferState = {}));
export var StatusType;
(function (StatusType) {
    StatusType[StatusType["RecipientEncryptionKey"] = 0] = "RecipientEncryptionKey";
    StatusType[StatusType["SenderSigningKey"] = 1] = "SenderSigningKey";
    StatusType[StatusType["Complete"] = 2] = "Complete";
    StatusType[StatusType["FileInfo"] = 3] = "FileInfo";
    StatusType[StatusType["Pause"] = 4] = "Pause";
})(StatusType || (StatusType = {}));
export var DataPayloadType;
(function (DataPayloadType) {
    DataPayloadType[DataPayloadType["SenderSigningKey"] = 0] = "SenderSigningKey";
    DataPayloadType[DataPayloadType["RecipientEncryptionKey"] = 1] = "RecipientEncryptionKey";
    DataPayloadType[DataPayloadType["FileInfo"] = 2] = "FileInfo";
    DataPayloadType[DataPayloadType["Status"] = 3] = "Status";
    DataPayloadType[DataPayloadType["Chunk"] = 4] = "Chunk";
    DataPayloadType[DataPayloadType["ChunkAck"] = 5] = "ChunkAck";
    DataPayloadType[DataPayloadType["PauseInfo"] = 6] = "PauseInfo";
})(DataPayloadType || (DataPayloadType = {}));
export var RecieveState;
(function (RecieveState) {
    RecieveState[RecieveState["Idel"] = 0] = "Idel";
    RecieveState[RecieveState["Connecting"] = 1] = "Connecting";
    RecieveState[RecieveState["Handshaking"] = 2] = "Handshaking";
    RecieveState[RecieveState["Recieveing"] = 3] = "Recieveing";
    RecieveState[RecieveState["Paused"] = 4] = "Paused";
    RecieveState[RecieveState["Retry"] = 5] = "Retry";
    RecieveState[RecieveState["Completed"] = 6] = "Completed";
    RecieveState[RecieveState["Closed"] = 7] = "Closed";
})(RecieveState || (RecieveState = {}));
export var WorkerAction;
(function (WorkerAction) {
    WorkerAction[WorkerAction["GetLocalTransferKey"] = 0] = "GetLocalTransferKey";
    WorkerAction[WorkerAction["GetRemoteTransferKey"] = 1] = "GetRemoteTransferKey";
    WorkerAction[WorkerAction["GetMetadata"] = 2] = "GetMetadata";
    WorkerAction[WorkerAction["InitWritable"] = 3] = "InitWritable";
    WorkerAction[WorkerAction["InitEncryption"] = 4] = "InitEncryption";
    WorkerAction[WorkerAction["InitGetChunks"] = 5] = "InitGetChunks";
    WorkerAction[WorkerAction["GetNextChunk"] = 6] = "GetNextChunk";
    WorkerAction[WorkerAction["SetIncomingChunk"] = 7] = "SetIncomingChunk";
    WorkerAction[WorkerAction["GetBitmap"] = 8] = "GetBitmap";
    WorkerAction[WorkerAction["RetryMissingChunks"] = 9] = "RetryMissingChunks";
    WorkerAction[WorkerAction["GetFileHash"] = 10] = "GetFileHash";
    WorkerAction[WorkerAction["FileHashProgress"] = 11] = "FileHashProgress";
    WorkerAction[WorkerAction["GetFileDownload"] = 12] = "GetFileDownload";
    WorkerAction[WorkerAction["NextChunkReady"] = 13] = "NextChunkReady";
    WorkerAction[WorkerAction["Pause"] = 14] = "Pause";
    WorkerAction[WorkerAction["Resume"] = 15] = "Resume";
    WorkerAction[WorkerAction["BackpressurePause"] = 16] = "BackpressurePause";
    WorkerAction[WorkerAction["BackpressureResume"] = 17] = "BackpressureResume";
    WorkerAction[WorkerAction["SendForRetry"] = 18] = "SendForRetry";
})(WorkerAction || (WorkerAction = {}));
export var WSMessageType;
(function (WSMessageType) {
    WSMessageType["Init"] = "init";
    WSMessageType["Offer"] = "offer";
    WSMessageType["Answer"] = "answer";
    WSMessageType["senderCandidates"] = "sender-candidates";
    WSMessageType["recieverCandidates"] = "reciever-candidates";
})(WSMessageType || (WSMessageType = {}));
