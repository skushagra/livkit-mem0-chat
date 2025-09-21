// app/api/dispatch-agent/route.ts
import { NextRequest, NextResponse } from "next/server";
import { AgentDispatchClient, RoomServiceClient } from "livekit-server-sdk";

export async function POST(req: NextRequest) {
    try {
        const { roomName } = await req.json();
        if (!roomName) return NextResponse.json({ error: "roomName required" }, { status: 400 });

        const url = process.env.LIVEKIT_URL!;   // https://<your>.livekit.cloud (NOT wss)
        const apiKey = process.env.LIVEKIT_API_KEY!;
        const apiSecret = process.env.LIVEKIT_API_SECRET!;
        const rooms = new RoomServiceClient(url, apiKey, apiSecret);

        // ensure room exists (idempotent)
        try { await rooms.createRoom({ name: roomName }); } catch { }

        // 🔒 idempotency: if an agent is already present, skip
        const parts = await rooms.listParticipants(roomName);
        const hasAgent = parts.some(p => p.identity?.startsWith("agent-"));
        if (hasAgent) {
            return NextResponse.json({ ok: true, skipped: "agent already present" });
        }

        const dispatch = await new AgentDispatchClient(url, apiKey, apiSecret)
            .createDispatch(roomName, "chat-helper-agent", {
                metadata: JSON.stringify({ source: "explicit-dispatch" }),
            });

        return NextResponse.json({ ok: true, dispatch });
    } catch (e: any) {
        return NextResponse.json({ error: e?.message ?? "dispatch failed" }, { status: 500 });
    }
}
