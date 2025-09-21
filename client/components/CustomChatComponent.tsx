"use client";

import * as React from "react";
import { useRoomContext } from "@livekit/components-react";
import {
    RoomEvent,
    type RemoteParticipant,
    type DataPacket_Kind,
} from "livekit-client";
import ReactMarkdown from "react-markdown";

type ChatRole = "user" | "assistant" | "system";

type Msg = {
    id: string;
    timestamp: number;
    message: string;
    role: ChatRole;
    ignoreLegacy?: boolean;
};

const TOPIC_DEFAULT = "lk-chat-topic";

// Typing indicator component
function TypingIndicator() {
    return (
        <div className="w-fit max-w-[75%] rounded-md px-3 py-2 text-sm mr-auto bg-accent">
            <div className="flex items-center space-x-1">
                <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                </div>
            </div>
        </div>
    );
}

// util
function makeId() {
    return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}
function makeEnvelope(message: string, role: ChatRole): Msg {
    return { id: makeId(), timestamp: Date.now(), message, role, ignoreLegacy: true };
}

export default function CustomDataChat({ topic = TOPIC_DEFAULT }: { topic?: string }) {
    const room = useRoomContext();

    // state
    const [items, setItems] = React.useState<Msg[]>([]);
    const [input, setInput] = React.useState("");
    const [sending, setSending] = React.useState(false);
    const [agentTyping, setAgentTyping] = React.useState(false);

    // refs
    const chatContainerRef = React.useRef<HTMLDivElement>(null);
    const seenIds = React.useRef<Set<string>>(new Set());
    const itemsRef = React.useRef<Msg[]>([]);
    const mountedOnce = React.useRef(false);

    // content-based dedupe: signature -> lastSeenMs
    const lastSeenBySignature = React.useRef<Map<string, number>>(new Map());

    // keep mirror ref
    React.useEffect(() => {
        itemsRef.current = items;
    }, [items]);

    // autoscroll on new messages or typing indicator
    React.useEffect(() => {
        const el = chatContainerRef.current;
        if (!el) return;
        // ensure DOM paint finished
        const t = setTimeout(() => {
            el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
        }, 0);
        return () => clearTimeout(t);
    }, [items, agentTyping]);

    // subscribe exactly once (even under StrictMode)
    React.useEffect(() => {
        if (!room) return;
        if (mountedOnce.current) return;
        mountedOnce.current = true;

        const handler = (
            payload: Uint8Array<ArrayBufferLike>,
            participant?: RemoteParticipant,
            _kind?: DataPacket_Kind,
            t?: string,
        ) => {
            try {
                if (t && t !== topic) return;

                const text = new TextDecoder().decode(payload);
                let incoming: Msg | null = null;

                // try envelope first
                try {
                    const j = JSON.parse(text);
                    if (j && typeof j.message === "string") {
                        incoming = {
                            id: typeof j.id === "string" ? j.id : makeId(),
                            timestamp: typeof j.timestamp === "number" ? j.timestamp : Date.now(),
                            message: j.message,
                            role: (j.role as ChatRole) ?? "assistant",
                            ignoreLegacy: j.ignoreLegacy,
                        };
                    }
                } catch {
                    // raw text -> assume assistant
                    incoming = makeEnvelope(text, "assistant");
                }
                if (!incoming) return;

                // drop echoes of our own messages (we already local-echo user side)
                if (
                    participant &&
                    room.localParticipant &&
                    participant.identity === room.localParticipant.identity
                ) {
                    // This would be our own publish loopback; ignore.
                    return;
                }

                // strong ID dedupe (when agents send IDs)
                if (seenIds.current.has(incoming.id)) return;

                // content dedupe (covers raw-text/no-id cases or multi-workers)
                // signature = role + '|' + trimmed content
                const sig = `${incoming.role}|${incoming.message.trim()}`;
                const now = Date.now();
                const last = lastSeenBySignature.current.get(sig) ?? 0;

                // within 3 seconds → treat as duplicate burst
                if (now - last < 3000) {
                    return;
                }
                lastSeenBySignature.current.set(sig, now);

                seenIds.current.add(incoming.id);
                setItems((prev) => [...prev, incoming!]);

                // Hide typing indicator when assistant responds
                if (incoming.role === "assistant") {
                    setAgentTyping(false);
                }
            } catch (e) {
                console.error("[client] DataReceived parse error:", e);
            }
        };

        room.on(RoomEvent.DataReceived, handler);

        return () => {
            room.off(RoomEvent.DataReceived, handler);
            mountedOnce.current = false;
        };
    }, [room, topic]);

    // send: local echo + publish
    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!room || !room.localParticipant) return;

        const text = input.trim();
        if (!text) return;

        const env = makeEnvelope(text, "user");

        try {
            setSending(true);

            // mark seen before publish to kill any loopback dupes
            seenIds.current.add(env.id);

            // local echo immediately
            setItems((prev) => [...prev, env]);

            // reset input quickly for snappy UX
            setInput("");

            // Show typing indicator since agent will likely respond
            setAgentTyping(true);

            const bytes = new TextEncoder().encode(JSON.stringify(env));
            await room.localParticipant.publishData(bytes, { reliable: true, topic });
        } catch (err) {
            // rollback on failure
            seenIds.current.delete(env.id);
            setItems((prev) => prev.filter((m) => m.id !== env.id));
            setInput(text);
            setAgentTyping(false); // Hide typing indicator on error
            console.error("[client] Failed to send:", err);
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="flex h-full flex-col overflow-hidden">
            {/* messages pane scrolls; input stays fixed at bottom */}
            <div
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0"
            >
                {items.length === 0 && (
                    <div className="text-sm text-muted-foreground sticky top-0 bg-background/80 backdrop-blur-sm p-2 rounded-md">
                        You have started an empty conversation
                    </div>
                )}

                {items.map((m) => {
                    const mine = m.role === "user";
                    return (
                        <div
                            key={m.id}
                            className={[
                                "w-fit max-w-[75%] rounded-md px-3 py-2 text-sm break-words",
                                mine
                                    ? "ml-auto bg-primary text-primary-foreground"
                                    : "mr-auto bg-accent",
                            ].join(" ")}
                            title={`${m.role} • ${new Date(m.timestamp).toLocaleString()}`}
                        >
                            <ReactMarkdown>{m.message}</ReactMarkdown>
                        </div>
                    );
                })}

                {/* Show typing indicator when agent is preparing response */}
                {agentTyping && <TypingIndicator />}
            </div>

            <form
                onSubmit={onSubmit}
                className="flex gap-2 p-3 border-t flex-shrink-0 bg-background"
            >
                <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="flex-1 rounded-md border px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder={sending ? "Sending…" : "Type a message…"}
                    disabled={sending}
                />
                <button
                    type="submit"
                    disabled={sending || !input.trim()}
                    className="rounded-md bg-primary text-primary-foreground px-3 py-2 text-sm disabled:opacity-60 hover:opacity-90 transition-opacity"
                >
                    Send
                </button>
            </form>
        </div>
    );
}
