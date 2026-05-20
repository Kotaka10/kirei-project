import OpenAI from "openai";
import { Connection } from "mysql2/promise";
import type { ChatCompletionMessageParam } from "openai/resources";
import { tools } from "./tools/definitions.js"; 
import { dispatchTool } from "./tools/dispatcher.js";
import dotenv from "dotenv";
dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = () => {
    const now = new Date();
    const today = now.toLocaleDateString("ja-JP", {
        year:     "numeric",
        month:    "2-digit",
        day:      "2-digit",
        weekday:  "short",
    });

    const time = now.toLocaleTimeString("ja-JP", {
        hour:   "2-digit",
        minute: "2-digit",
    });

    return `あなたは清掃・メンテナンスサービス会社の社内AIアシスタントです。
            スタッフや管理者からの質問に日本語で答えてください。

            回答はデータがある場合は箇条書きで見やすく整理してください。
            【現在日付】${today} ${time}
            【タイムゾーン】 Asia/Tokyo
            
            今日・明日・今週・今月などの相対的な日付表現は、上記の現在日時を基準に計算してください`
}

export async function chat(
    conn: Connection,
    userMessage: string,
    history: ChatCompletionMessageParam[] = [],
): Promise<{ reply: string; history: ChatCompletionMessageParam[] }> {
    const messages: ChatCompletionMessageParam[] = [
        { role: "system", content: SYSTEM_PROMPT() },
        ...history,
        { role: "user", content: userMessage},
    ];

    const step1 = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages,
        tools,
        tool_choice: "auto",
    });

    const aiMsg = step1.choices[0]?.message;
    if (!aiMsg) {
        return { reply: "", history: messages.slice(1) };
    }
    messages.push(aiMsg as ChatCompletionMessageParam);

    if (!aiMsg.tool_calls?.length) {
        return {
            reply: aiMsg.content ?? "",
            history: messages.slice(1),
        }
    }

    for (const toolCall of aiMsg.tool_calls) {
        if (toolCall.type !== "function") continue;
        const name = toolCall.function.name;
        const args = JSON.parse(toolCall.function.arguments);

        console.log(`[Tool] ${name}(${JSON.stringify(args)})`);

        const result = await dispatchTool(conn, name, args);

        messages.push({
            role:         "tool",
            tool_call_id: toolCall.id,
            content:      result,
        });
    }

    const step2 = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages,
    });

    const finalMsg = step2.choices[0]?.message;
    if (!finalMsg) {
        return { reply: "", history: messages.slice(1) };
    }
    messages.push(finalMsg as ChatCompletionMessageParam);

    return {
        reply:   finalMsg.content ?? "",
        history: messages.slice(1),
    }
}