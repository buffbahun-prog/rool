import { TypedEmitter } from "../src/core/emmiter";
import { WSEvents, WSMessageEvent, WSMessageType } from "../src/types";

export class SenderWS extends TypedEmitter<WSEvents> {
  private roomConnectWS: WebSocket | null;
  private roomCode: string | null;

  private offer: string | null = null;
  private candidates: string[] = [];

  constructor() {
    super();
    this.roomConnectWS = null;
    this.roomCode = null;
  }

  async init() {
    try {
      const res = await fetch("https://rool.buffbahun.workers.dev/api/create");
    //   const res = await fetch("http://localhost:8787/api/create");
      const data: {code: string} = await res.json();

      this.roomCode =  data.code;
      this.emit("roomCreate", {code: data.code});

      if (this.roomConnectWS) return;

      this.emit("roomJoining", null);
      this.roomConnectWS = await this.createWebSocket(`wss://rool.buffbahun.workers.dev/room/${this.roomCode}`);
    //   this.roomConnectWS = await this.createWebSocket(`ws://localhost:8787/room/${this.roomCode}`);

      this.emit("roomJoin", {code: data.code});
        
      this.roomConnectWS.onmessage = (msg: MessageEvent<string>) => {
        const serverMsgStr = msg.data
        if (!serverMsgStr) {
            this.emit("error", new Error("Response from server is empty"));
            return;
        }
        const serverMsg: WSMessageEvent = JSON.parse(serverMsgStr);
        this.onMessageRecieved(serverMsg);
      };

    } catch (err: any) {
      this.emit("error", err as Error);
      console.log("err", err);
    }
  }

  private async createWebSocket(url: string): Promise<WebSocket> {
    const ws = new WebSocket(url);

    await new Promise<void>((resolve, reject) => {
        ws.addEventListener("open", () => resolve(), { once: true });
        ws.addEventListener("error", (evt) => {
            ws.close();
            reject(new Error("Connection failed"))
        }, { once: true });
        ws.addEventListener("close", async (evt) => {
            this.roomConnectWS = await this.createWebSocket(`wss://rool.buffbahun.workers.dev/room/${this.roomCode}`);
            if (this.offer) this.sendOffer(this.offer);
            this.candidates.forEach(cd => this.sendSenderCandidates(cd));
        })
    });

    return ws;
  }

  private sendToServer(type: WSMessageType, msg: string) {
    try {
      if (!this.roomConnectWS) throw new Error("Web socket not initialized");
      switch (type) {
        case "offer":
          if (!msg) throw new Error("offer message empty");
          const offerMsg: WSMessageEvent = {
            type: type,
            offer: msg
          }
          this.roomConnectWS.send(JSON.stringify(offerMsg));
          break;

        case "sender-candidates":
          if (!msg) throw new Error("sender candidates message empty");
          const senderCandidatesMsg: WSMessageEvent = {
            type: type,
            senderCandidates: msg
          }
          this.roomConnectWS.send(JSON.stringify(senderCandidatesMsg));
          break;

        default:
          throw new Error(`no such message as ${type} to be send from Sender`);
      }
    } catch (err) {
      this.emit("error", err as Error);
    }
  }

  private onMessageRecieved(msg: WSMessageEvent) {
    try {
      switch (msg.type) {
        case WSMessageType.Init:
          break;
        case WSMessageType.Offer:
          break;
        case WSMessageType.Answer:
          if (!msg.answer) throw new Error("answer from server is empty.");
          this.emit("answer", { value: msg.answer });
          break;
        case WSMessageType.recieverCandidates:
          if (!msg.recieverCandidates) throw new Error("reciever candidates from server is empty.")
          this.emit("recieverCandidates", { value: msg.recieverCandidates });
          break;
        case WSMessageType.senderCandidates:
          break;
        default:
          throw new Error(`no just server message type ${msg}`);
      }
    } catch (err) {
      this.emit("error", err as Error);
    }
  }

  sendSenderCandidates(candidates: string) {
    this.candidates.push(candidates);
    this.sendToServer(WSMessageType.senderCandidates, candidates);
  }

  sendOffer(offer: string) {
    this.offer = offer;
    this.sendToServer(WSMessageType.Offer, offer);
  }
}