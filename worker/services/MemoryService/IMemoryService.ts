import { Message, SearchHit } from "./types.js";



export default interface IMemoryService {
    addConversation(userId: string, messages: Message[], tags?: string[]): Promise<void>;
    search(userId: string, query: string): Promise<SearchHit[]>;
    renderContext(mems: SearchHit[], max: number): string;
}