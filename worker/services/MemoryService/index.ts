import IMemoryService from "./IMemoryService.js";
import { Message, SearchHit } from "./types.js";

export default class Mem0Service implements IMemoryService {

    readonly API_KEY: string;
    readonly V1: string;
    readonly V2: string;

    constructor(mem0_api_key: string, mem0_v1?: string, mem0_v2?: string) {
        this.API_KEY = mem0_api_key;
        this.V1 = mem0_v1 ?? "https://api.mem0.ai/v1";
        this.V2 = mem0_v2 ?? "https://api.mem0.ai/v2";
    }

    async addConversation(userId: string, messages: Message[], tags?: string[]): Promise<void> {
        if (!this.API_KEY) return;
        try {
            const res = await fetch(`${this.V1}/memories/`, {
                method: "POST",
                headers: {
                    "content-type": "application/json",
                    "authorization": `Token ${this.API_KEY}`, // <-- per docs
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

    async search(userId: string, query: string): Promise<SearchHit[]> {
        if (!this.API_KEY) return [];
        try {
            const res = await fetch(`${this.V2}/memories/search/`, {
                method: "POST",
                headers: {
                    "content-type": "application/json",
                    "authorization": `Token ${this.API_KEY}`, // <-- per docs
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
            return arr as SearchHit[];
        } catch (e) {
            console.warn("[mem0] search error:", e);
            return [];
        }
    }

    renderContext(mems: SearchHit[], max: number): string {
        const top = mems
            .slice(0, max)
            .map((m, i) => `- ${m.text ?? ""}`)
            .filter(Boolean)
            .join("\n");
        return top ? `Relevant user memory:\n${top}` : "";
    }
}