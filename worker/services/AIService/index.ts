import { Role } from "../../lib/types.js";
import IAIService from "./IAIService.js";

export default class OpenAIAgent implements IAIService {

    readonly model;
    readonly temperature;
    readonly api_key;

    constructor(api_key: string, model: string, temp: number = 0.7) {
        this.api_key = api_key;
        this.model = model;
        this.temperature = temp;
    }

    async complete(messages: { role: Role; content: string; }[]): Promise<string> {
        if (!this.api_key) {
            console.error("[agent] OPENAI_API_KEY missing");
            return "";
        }
        try {
            const res = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "content-type": "application/json",
                    "authorization": `Bearer ${this.api_key}`,
                },
                body: JSON.stringify({
                    model: this.model,
                    messages,
                    temperature: this.temperature,
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

}