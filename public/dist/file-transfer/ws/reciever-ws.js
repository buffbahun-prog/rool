import { TypedEmitter } from "../src/core/emmiter.js";
import { WSMessageType } from "../src/types.js";
export class RecieverWS extends TypedEmitter {
    constructor() {
        super();
        this.roomConnectWS = null;
        this.roomCode = null;
    }
    async init(roomCode) {
        try {
            if (!roomCode)
                throw new Error("Room code is empty");
            this.roomCode = roomCode;
            if (this.roomConnectWS)
                return;
            this.emit("roomJoining", null);
            this.roomConnectWS = await this.createWebSocket(`ws://localhost:8787/room/${this.roomCode}`);
            this.emit("roomJoin", { code: roomCode });
            this.roomConnectWS.onmessage = (msg) => {
                const serverMsgStr = msg.data;
                console.log(msg, msg.data, "msg data");
                if (!serverMsgStr) {
                    this.emit("error", new Error("Response from server is empty"));
                    return;
                }
                const serverMsg = JSON.parse(serverMsgStr);
                this.onMessageRecieved(serverMsg);
            };
        }
        catch (err) {
            this.emit("error", err);
        }
    }
    async createWebSocket(url) {
        const ws = new WebSocket(url);
        await new Promise((resolve, reject) => {
            ws.addEventListener("open", () => resolve(), { once: true });
            ws.addEventListener("error", () => reject(new Error("Connection failed")), { once: true });
        });
        return ws;
    }
    sendToServer(type, msg) {
        try {
            if (!this.roomConnectWS)
                throw new Error("Web socket not initialized");
            switch (type) {
                case "answer":
                    if (!msg)
                        throw new Error("answer message empty");
                    const answerMsg = {
                        type: type,
                        answer: msg
                    };
                    this.roomConnectWS.send(JSON.stringify(answerMsg));
                    break;
                case "reciever-candidates":
                    if (!msg)
                        throw new Error("reciever candidates message empty");
                    const recieverCandidatesMsg = {
                        type: type,
                        recieverCandidates: msg
                    };
                    this.roomConnectWS.send(JSON.stringify(recieverCandidatesMsg));
                    break;
                default:
                    throw new Error(`no such message as ${type} to be send from Sender`);
            }
        }
        catch (err) {
            this.emit("error", err);
        }
    }
    onMessageRecieved(msg) {
        try {
            switch (msg.type) {
                case WSMessageType.Init:
                    if (!msg.offer)
                        throw new Error("offer from server is empty.");
                    if (!msg.senderCandidates)
                        throw new Error("sender candidates from server is empty.");
                    this.emit("offer", { value: msg.offer });
                    this.emit("senderCandidates", { value: msg.senderCandidates });
                    break;
                case WSMessageType.Offer:
                    if (!msg.offer)
                        throw new Error("offer from server is empty.");
                    this.emit("offer", { value: msg.offer });
                    break;
                case WSMessageType.Answer:
                    break;
                case WSMessageType.recieverCandidates:
                    break;
                case WSMessageType.senderCandidates:
                    if (!msg.senderCandidates)
                        throw new Error("sender candidates from server is empty.");
                    this.emit("senderCandidates", { value: msg.senderCandidates });
                    break;
                default:
                    throw new Error(`no just server message type ${msg}`);
            }
        }
        catch (err) {
            this.emit("error", err);
        }
    }
    sendAnswer(answer) {
        this.sendToServer(WSMessageType.Answer, answer);
    }
    sendRecieverCandidates(candidates) {
        this.sendToServer(WSMessageType.recieverCandidates, candidates);
    }
}
