import { Role, Envelope } from "../../lib/types.js";
import IMessageService from "./IMessageService.js";


export default class MessageService implements IMessageService {

    makeId() {
        return (globalThis as any).crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
    }

    pack(message: string, role: Role): Envelope {
        return { id: this.makeId(), timestamp: Date.now(), message, role, ignoreLegacy: true };
    }

}