import { AccessToken, VideoGrant } from "livekit-server-sdk";

export default async function getAccessToken(
    roomName: string,
    username: string
): Promise<string> {
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;

    if (!apiKey || !apiSecret) {
        throw new Error('LiveKit API key and secret must be provided');
    }

    const participantName = username;

    const at = new AccessToken(apiKey, apiSecret, {
        identity: participantName,
    });

    const videoGrant: VideoGrant = {
        room: roomName,
        roomJoin: true,
        canPublish: true,
        canSubscribe: true,
    };

    at.addGrant(videoGrant);

    const token = await at.toJwt();

    return token;
}
