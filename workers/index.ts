// index.ts
import { Room } from "./room";
export { Room };

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

export default {
  async fetch(request: any, env: any) {
    const url = new URL(request.url);

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // CREATE ROOM
    if (url.pathname === "/api/create") {
      const code = generateCode();
      
      const id = env.ROOMS.idFromName(code);
      const room = env.ROOMS.get(id);
      
      // Tell the Durable Object to mark itself as initialized/created
      await room.fetch(new Request(`${url.origin}/initialize`, { method: "POST" }));

      return Response.json({ code }, { headers: corsHeaders });
    }

    // WEBRTC SIGNALING ROOM
    if (url.pathname.startsWith("/room/")) {
      const code = url.pathname.split("/")[2];

      const id = env.ROOMS.idFromName(code);
      const room = env.ROOMS.get(id);

      // Check if this room has actually been initialized
      const checkRes = await room.fetch(new Request(`${url.origin}/check`));
      const { exists } = await checkRes.json();

      if (!exists) {
        return new Response(
          JSON.stringify({ error: "Room not found. Please create a room first." }), 
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // If it exists, pass through the request (to complete the WebSocket upgrade)
      return room.fetch(request);
    }

    return new Response("Not found", { status: 404 });
  }
};

function generateCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 5; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}