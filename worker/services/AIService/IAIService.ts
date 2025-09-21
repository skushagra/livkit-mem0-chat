import { Role } from "../../lib/types.js";

export default interface IAIService {
    complete(messages: { role: Role; content: string }[]): Promise<string>;
} 