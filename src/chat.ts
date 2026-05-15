import OpenAI from "openai";
import { Connection } from "mysql2/promise";
import { ChatCompletionMessageParam } from "openai/resources";
import { tools } from "./tools/definitions";
import { dispatchTool } from "./tools/dispatcher";
import dotenv from "dotenv";
dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `あなたは清掃・メンテナンスサービス会社の社内AIアシスタントです。
スタッフや管理者からの質問に日本語で答えてください。

使えるツール:
- 顧客の過去予約履歴の確認
- スタッフの空き状況・祝日・繁忙期の確認
- 今日・指定日のスケジュール確認
- 売上集計・昨対比の確認
- エアコン清掃などの一般的な質問はツール不要で直接回答

回答はデータがある場合は箇条書きで見やすく整理してください。
日付は「2025年5月14日（水）」のように読みやすく表記してください。`;

export async function chat(
    conn: Connection,
    userMessage: string,
    history: ChatCompletionMessageParam[] = [],
): Promise<{ reply: string; history: ChatCompletionMessageParam[] }> {
    const messages: ChatCompletionMessageParam[] = [
        { role: "system", content: SYSTEM_PROMPT },
        ...history,
        { role: "user", content: userMessage},
    ];

    const step1 = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages,
        tools,
        tool_choice: "auto",
    });

    const aiMsg = step1.choices[0].message;
    messages.push(aiMsg);

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

    const finalMsg = step2.choices[0].message;
    messages.push(finalMsg);

    return {
        reply:       finalMsg.content ?? "",
        history:     messages.slice(1),
    }
}