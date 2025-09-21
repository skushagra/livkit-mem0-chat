import "dotenv/config";
import { config } from "dotenv";
import { join } from "path";
import {
    defineAgent,
    cli,
    WorkerOptions,
    type JobContext,
} from "@livekit/agents";

import { RoomEvent } from "@livekit/rtc-node";

import { TOPIC, MEM0_API_KEY, OPENAI_API_KEY, OPENAI_MODEL, MEM0_V1, MEM0_V2 } from "./lib/constants.js";
import { Role } from "./lib/types.js";
import IMemoryService from "./services/MemoryService/IMemoryService.js";
import Mem0Service from "./services/MemoryService/index.js";
import IAIService from "./services/AIService/IAIService.js";
import OpenAIAgent from "./services/AIService/index.js";
import IMessageService from "./services/MessageService/IMessageService.js";
import MessageService from "./services/MessageService/index.js";

config({ path: join(process.cwd(), "./.env.local") });

const memoryService: IMemoryService = new Mem0Service(MEM0_API_KEY, MEM0_V1, MEM0_V2);
const aiService: IAIService = new OpenAIAgent(OPENAI_API_KEY, OPENAI_MODEL, 0.7);
const messageService: IMessageService = new MessageService();

export default defineAgent({
    entry: async (ctx: JobContext) => {

        await ctx.connect();

        const room = ctx.room;

        if (!room) throw new Error("No room after connect()");
        console.log("[agent] connected to room:", room.name);

        const history: { role: Role; content: string }[] = [
            {
                role: "system",
                content:
                    "You are a helpful, concise assistant. If a 'Relevant user memory' context is provided, incorporate it. You should respond in markdown when appropriate. Respond in a clear single message and actively listen for messages from the user",
            },
        ];

        if (room.localParticipant) {
            const env = messageService.pack("AI assistant has joined the chat!", "assistant");
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

                // Search Mem0 for helpful context
                let memContext = "";
                if (MEM0_API_KEY) {
                    const hits = await memoryService.search(userId, userText);
                    memContext = memoryService.renderContext(hits, 5);
                }

                // Build prompt with optional memory
                const turn: { role: Role; content: string }[] = [];
                if (memContext) turn.push({ role: "system", content: memContext });
                turn.push({ role: "user", content: userText });

                // extend history → call model
                const prompt = [...history, ...turn];
                let reply = await aiService.complete(prompt);
                if (!reply) reply = "I cannot respond to this at the moment. Please try again later or check connection.";

                // append to running history
                history.push({ role: "user", content: userText });
                history.push({ role: "assistant", content: reply });

                // Store the exchange in Mem0 (v1/memories/)
                if (MEM0_API_KEY) {
                    await memoryService.addConversation(userId, [
                        { role: "user", content: userText },
                        { role: "assistant", content: reply },
                    ]);
                }

                // Publish reply to chat UI
                if (!room.localParticipant) return;
                const env = messageService.pack(reply, "assistant");
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


const agentEntryPath = new URL(import.meta.url).pathname;
cli.runApp(new WorkerOptions({ agent: agentEntryPath, agentName: "chat-helper-agent" }));
