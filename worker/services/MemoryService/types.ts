import { Role } from "../../lib/types.js";

export type Message = { role: Role; content: string };
export type SearchHit = { id?: string; text?: string; score?: number; created_at?: string; tags?: string[] };
