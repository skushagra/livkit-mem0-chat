import { config } from "dotenv";
import { join } from "path";

config({ path: join(process.cwd(), "./.env.local") });

import "dotenv/config";
import {
    defineAgent,
    cli,
    WorkerOptions,
    type JobContext,
} from "@livekit/agents";
import { RoomEvent } from "@livekit/rtc-node";

type Role = "user" | "assistant" | "system";
type Envelope = {
    id: string;
    timestamp: number;
    message: string;
    role: Role;
    ignoreLegacy?: boolean;
};

const TOPIC = "lk-chat-topic";
const OPENAI_MODEL = "gpt-4o-mini";
const MEM0_V1 = process.env.MEM0_BASE_V1 || "https://api.mem0.ai/v1";
const MEM0_V2 = process.env.MEM0_BASE_V2 || "https://api.mem0.ai/v2";
const MEM0_API_KEY = process.env.MEM0_API_KEY || "";

// ---------- helpers ----------
function makeId() {
    return (globalThis as any).crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}
function pack(message: string, role: Role): Envelope {
    return { id: makeId(), timestamp: Date.now(), message, role, ignoreLegacy: true };
}

async function openaiComplete(messages: { role: Role; content: string }[]): Promise<string> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        console.error("[agent] OPENAI_API_KEY missing");
        return "";
    }
    try {
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "content-type": "application/json",
                "authorization": `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: OPENAI_MODEL,
                messages,
                temperature: 0.7,
            }),
        });
        if (!res.ok) {
            const txt = await res.text().catch(() => "");
            throw new Error(`OpenAI HTTP ${res.status}: ${txt || res.statusText}`);
        }
        const json: any = await res.json();
        return (json?.choices?.[0]?.message?.content ?? "").trim();
    } catch (err) {
        console.error("[agent] openaiComplete error:", err);
        return "";
    }
}

// ---------- Mem0 adapter (per your docs) ----------
type Mem0Message = { role: "user" | "assistant" | "system"; content: string };
type Mem0SearchHit = { id?: string; text?: string; score?: number; created_at?: string; tags?: string[] };

async function mem0AddConversation(userId: string, messages: Mem0Message[], tags?: string[]) {
    if (!MEM0_API_KEY) return;
    try {
        const res = await fetch(`${MEM0_V1}/memories/`, {
            method: "POST",
            headers: {
                "content-type": "application/json",
                "authorization": `Token ${MEM0_API_KEY}`, // <-- per docs
            },
            body: JSON.stringify({
                messages,
                user_id: userId,
                version: "v2",
                ...(tags ? { tags } : {}),
            }),
        });
        if (!res.ok) {
            const txt = await res.text().catch(() => "");
            console.warn(`[mem0] add ${res.status}: ${txt}`);
        }
    } catch (e) {
        console.warn("[mem0] add error:", e);
    }
}

async function mem0Search(userId: string, query: string): Promise<Mem0SearchHit[]> {
    if (!MEM0_API_KEY) return [];
    try {
        const res = await fetch(`${MEM0_V2}/memories/search/`, {
            method: "POST",
            headers: {
                "content-type": "application/json",
                "authorization": `Token ${MEM0_API_KEY}`, // <-- per docs
            },
            body: JSON.stringify({
                query,
                // per docs: filters.OR with user_id
                filters: { OR: [{ user_id: userId }] },
            }),
        });
        if (!res.ok) {
            const txt = await res.text().catch(() => "");
            console.warn(`[mem0] search ${res.status}: ${txt}`);
            return [];
        }
        const json: any = await res.json();
        // API returns an array; normalize just in case
        const arr: any[] = Array.isArray(json) ? json : json?.results ?? json?.memories ?? [];
        return arr as Mem0SearchHit[];
    } catch (e) {
        console.warn("[mem0] search error:", e);
        return [];
    }
}

// Turn top mems into a compact context string (keep it small)
function renderMemContext(mems: Mem0SearchHit[], max = 5): string {
    const top = mems
        .slice(0, max)
        .map((m, i) => `- ${m.text ?? ""}`)
        .filter(Boolean)
        .join("\n");
    return top ? `Relevant user memory:\n${top}` : "";
}

// ---------- Agent ----------
export default defineAgent({
    entry: async (ctx: JobContext) => {
        await ctx.connect();
        const room = ctx.room;
        if (!room) throw new Error("No room after connect()");
        console.log("[agent] connected to room:", room.name);

        // Keep model convo for coherence
        const history: { role: Role; content: string }[] = [
            {
                role: "system",
                content:
                    "You are a helpful, concise assistant. If a 'Relevant user memory' context is provided, incorporate it.",
            },
        ];

        // greet once
        if (room.localParticipant) {
            const env = pack("AI assistant has joined the chat!", "assistant");
            try {
                await room.localParticipant.publishData(
                    new TextEncoder().encode(JSON.stringify(env)),
                    { reliable: true, topic: TOPIC },
                );
                console.log("[agent] greeting sent on", TOPIC);
            } catch (e) {
                console.warn("[agent] greeting publish failed:", e);
            }
        }

        // incoming user text
        room.on(RoomEvent.DataReceived, async (payload, from, _kind, topic?: string) => {
            try {
                if (topic && topic !== TOPIC) return;
                if (from?.identity?.startsWith?.("agent-")) return;

                // pick a stable user id for memories
                const userId = from?.identity || `room:${room.name}`;

                // decode envelope or raw
                const raw = new TextDecoder().decode(payload).trim();
                let userText = raw;
                try {
                    const j = JSON.parse(raw);
                    if (j && typeof j.message === "string") userText = j.message;
                } catch { /* raw text */ }
                if (!userText) return;

                // 1) Search Mem0 for helpful context
                let memContext = "";
                if (MEM0_API_KEY) {
                    const hits = await mem0Search(userId, userText);
                    memContext = renderMemContext(hits, 5);
                }

                // 2) Build prompt with optional memory
                const turn: { role: Role; content: string }[] = [];
                if (memContext) turn.push({ role: "system", content: memContext });
                turn.push({ role: "user", content: userText });

                // extend history → call model
                const prompt = [...history, ...turn];
                let reply = await openaiComplete(prompt);
                if (!reply) reply = "Got it. What next?";

                // append to running history
                history.push({ role: "user", content: userText });
                history.push({ role: "assistant", content: reply });

                // 3) Store the exchange in Mem0 (v1/memories/)
                if (MEM0_API_KEY) {
                    await mem0AddConversation(userId, [
                        { role: "user", content: userText },
                        { role: "assistant", content: reply },
                    ]);
                }

                // 4) Publish reply to chat UI
                if (!room.localParticipant) return;
                const env = pack(reply, "assistant");
                await room.localParticipant.publishData(
                    new TextEncoder().encode(JSON.stringify(env)),
                    { reliable: true, topic: topic || TOPIC },
                );
                console.log("[agent] replied (mem-backed):", reply.slice(0, 140));
            } catch (e) {
                console.error("[agent] DataReceived error:", e);
            }
        });
    },
});

// IMPORTANT: CLI wants a filesystem path (not file:// URL)
const agentEntryPath = new URL(import.meta.url).pathname;
cli.runApp(new WorkerOptions({ agent: agentEntryPath, agentName: "chat-helper-agent" }));
