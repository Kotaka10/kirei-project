import OpenAI from "openai";
import { getConnection } from "./db/connection";
import { tools } from "./tools/definitions";
import { getCustomerBookings } from "./tools/handlers";
import dotenv from "dotenv";
dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `あなたは清掃・メンテナンスサービス会社の社内AIアシスタントです。
顧客の予約履歴について質問されたら、必ずget_customer_bookingsツールを使って答えてください。
回答は日本語で、データを見やすく整理して返してください。`;

async function askAI(userMessage: string): Promise<void> {
    const conn = await getConnection();

    try {
        console.log(`\n質問: ${userMessage}`);
        console.log("-".repeat(50));

        const step1 = await openai.chat.completions.create({ //OpenAIのLLM（GPT）にメッセージを送って、回答を生成してもらうAPI呼び出し
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                { role: "user", content: userMessage },
            ],
            tools,
            tool_choice: "auto",
        });

        const aiMessage = step1.choices[0].message; //choicesはOpenAIに元々あるプロパティ

        if (!aiMessage.tool_calls?.length) { // tool_callsも元々あるプロパティ tool_callsはAIが呼びたいツール情報
            console.log("回答: ", aiMessage.content);
            return;
        }

        const toolCall = aiMessage.tool_calls[0];
        if (toolCall.type !== 'function') return;
        const args = JSON.parse(toolCall.function.arguments);
        console.log(`[Tool呼び出し] get_customer_bookings(${JSON.stringify(args)})`);

        const dbResult = await getCustomerBookings(conn, args);
        console.log("[DB結果]", JSON.stringify(dbResult, null, 2));

        const step2 = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                { role: "user", content: userMessage },
                aiMessage, // AIが「このtool呼んで」と言った履歴をGPTへ再度渡している
                {
                    role: "tool", // これはtool実行結果であると伝えている
                    tool_call_id: toolCall.id, // どのtool callへの実行結果かを識別するID
                    content: JSON.stringify(dbResult),
                },
            ],
        });

        console.log("\n回答：\n" + step2.choices[0].message.content);
    } finally {
        await conn.end();
    }
}

(async () => {
    await askAI("佐藤さんの過去の予約を教えてください");
})();