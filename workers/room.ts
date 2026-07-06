// room.ts
import { DurableObjectState } from "@cloudflare/workers-types/experimental";

export class Room {
  state: DurableObjectState;
  env: any;
  clients: Set<WebSocket>;

  offer: string | null = null;
  answer: string | null = null;
  senderCandidates: string[] = [];
  recieverCandidates: string[] = [];
  
  // Keep track of memory initialization state
  isInitialized: boolean = false;

  constructor(state: DurableObjectState, env: any) {
    this.state = state;
    this.env = env;
    this.clients = new Set();
    
    // Asynchronously load the active state from persistent storage
    this.state.blockConcurrencyWhile(async () => {
      const exists = await this.state.storage.get<boolean>("exists");
      this.isInitialized = !!exists;
    });
  }

  async fetch(request: Request) {
    const url = new URL(request.url);

    // 1. ENDPOINT TO INITIALIZE THE ROOM (Called by /api/create)
    if (url.pathname === "/initialize") {
      await this.state.storage.put("exists", true);
      this.isInitialized = true;
      return new Response("OK", { status: 200 });
    }

    // 2. ENDPOINT TO CHECK EXISTENCE
    if (url.pathname === "/check") {
      return new Response(JSON.stringify({ exists: this.isInitialized }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    // --- EXISTING WEBSOCKET LOGIC ---
    const upgradeHeader = request.headers.get("Upgrade");
    if (upgradeHeader !== "websocket") {
      return new Response("WebSocket expected", { status: 400 });
    }

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    server.accept();
    this.clients.add(server);

    server.send(JSON.stringify({
      type: "init",
      offer: this.offer,
      answer: this.answer,
      senderCandidates: this.senderCandidates,
      recieverCandidates: this.recieverCandidates,
    }));

    server.addEventListener("message", (event) => {
      const msg = JSON.parse(event.data);
      switch (msg.type) {
        case "offer": this.offer = msg.offer; break;
        case "answer": this.answer = msg.answer; break;
        case "sender-candidates": this.senderCandidates.push(msg.senderCandidates); break;
        case "reciever-candidates": this.recieverCandidates.push(msg.recieverCandidates); break;
      }
      for (const ws of this.clients) {
        if (ws !== server) ws.send(event.data);
      }
    });

    server.addEventListener("close", () => this.clients.delete(server));
    server.addEventListener("error", () => this.clients.delete(server));

    return new Response(null, {
      status: 101,
      webSocket: client
    } as any);
  }
}