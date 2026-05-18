import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateJSON<T>(
    userPrompt: string,
    systemPrompt: string
): Promise<T> {
    const res = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
        ],
    });

    const text = res.choices[0].message.content ?? "{}";

    return JSON.parse(text) as T;
}