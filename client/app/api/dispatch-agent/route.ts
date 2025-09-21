// app/api/dispatch-agent/route.ts
import { NextRequest, NextResponse } from "next/server";
import { AgentDispatchClient, RoomServiceClient } from "livekit-server-sdk";

export async function POST(req: NextRequest) {
    try {
        const { roomName } = await req.json();
        if (!roomName) return NextResponse.json({ error: "roomName required" }, { status: 400 });

        const url = process.env.LIVEKIT_URL!; // https://attackchat-....livekit.cloud
        const apiKey = process.env.LIVEKIT_API_KEY!;
        const apiSecret = process.env.LIVEKIT_API_SECRET!;
        if (!url || !apiKey || !apiSecret)
            return NextResponse.json({ error: "server env not set" }, { status: 500 });

        console.log("[dispatch-agent] dispatching for room:", roomName);

        // ensure room exists (safe if already exists)
        const rooms = new RoomServiceClient(url, apiKey, apiSecret);
        try { await rooms.createRoom({ name: roomName }); } catch { }

        const client = new AgentDispatchClient(url, apiKey, apiSecret);
        const dispatch = await client.createDispatch(roomName, "chat-helper-agent", {
            metadata: JSON.stringify({ source: "explicit-dispatch" }),
        });

        return NextResponse.json({ ok: true, dispatch });
    } catch (e: any) {
        console.error("[dispatch-agent] error:", e?.message || e);
        return NextResponse.json({ error: e?.message ?? "dispatch failed" }, { status: 500 });
    }
}
