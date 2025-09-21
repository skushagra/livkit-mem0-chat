import { NextRequest, NextResponse } from "next/server";
import { AccessToken } from "livekit-server-sdk";

export async function POST(req: NextRequest) {
    try {
        const { roomName, username } = await req.json();

        if (!roomName || !username) {
            return NextResponse.json({ error: "roomName and username required" }, { status: 400 });
        }

        const at = new AccessToken(
            process.env.LIVEKIT_API_KEY!,
            process.env.LIVEKIT_API_SECRET!,
            { identity: username, ttl: "10m" }
        );

        at.addGrant({ roomJoin: true, room: roomName });


        return NextResponse.json({ token: await at.toJwt() });
    } catch (e: any) {
        return NextResponse.json({ error: e?.message ?? "failed to create token" }, { status: 500 });
    }
}
