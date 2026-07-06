import { TypedEmitter } from "../src/core/emmiter.js";
import { WSMessageType } from "../src/types.js";
export class SenderWS extends TypedEmitter {
    constructor() {
        super();
        this.roomConnectWS = null;
        this.roomCode = null;
    }
    async init() {
        try {
            const res = await fetch("http://localhost:8787/api/create");
            const data = await res.json();
            this.roomCode = data.code;
            await new Promise(resolve => setTimeout(resolve, 2000));
            this.emit("roomCreate", { code: data.code });
            if (this.roomConnectWS)
                return;
            this.emit("roomJoining", null);
            this.roomConnectWS = await this.createWebSocket(`ws://localhost:8787/room/${this.roomCode}`);
            this.emit("roomJoin", { code: data.code });
            this.roomConnectWS.onmessage = (msg) => {
                const serverMsgStr = msg.data;
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
            console.log("err", err);
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
                case "offer":
                    if (!msg)
                        throw new Error("offer message empty");
                    const offerMsg = {
                        type: type,
                        offer: msg
                    };
                    this.roomConnectWS.send(JSON.stringify(offerMsg));
                    break;
                case "sender-candidates":
                    if (!msg)
                        throw new Error("sender candidates message empty");
                    const senderCandidatesMsg = {
                        type: type,
                        senderCandidates: msg
                    };
                    this.roomConnectWS.send(JSON.stringify(senderCandidatesMsg));
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
                    break;
                case WSMessageType.Offer:
                    break;
                case WSMessageType.Answer:
                    if (!msg.answer)
                        throw new Error("answer from server is empty.");
                    this.emit("answer", { value: msg.answer });
                    break;
                case WSMessageType.recieverCandidates:
                    if (!msg.recieverCandidates)
                        throw new Error("reciever candidates from server is empty.");
                    this.emit("recieverCandidates", { value: msg.recieverCandidates });
                    break;
                case WSMessageType.senderCandidates:
                    break;
                default:
                    throw new Error(`no just server message type ${msg}`);
            }
        }
        catch (err) {
            this.emit("error", err);
        }
    }
    sendSenderCandidates(candidates) {
        this.sendToServer(WSMessageType.senderCandidates, candidates);
    }
    sendOffer(offer) {
        this.sendToServer(WSMessageType.Offer, offer);
    }
}
