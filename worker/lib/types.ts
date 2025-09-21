export type Role = "user" | "assistant" | "system";

export type Envelope = {
    id: string;
    timestamp: number;
    message: string;
    role: Role;
    ignoreLegacy?: boolean;
};