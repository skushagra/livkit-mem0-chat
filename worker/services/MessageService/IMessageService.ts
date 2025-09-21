
import { Role, Envelope } from "../../lib/types.js";

export default interface IMessageService {
    makeId(): string;
    pack(message: string, role: Role): Envelope;
}