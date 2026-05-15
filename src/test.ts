import { chat } from "./chat";
import { getConnection } from "./db/connection";
import { ChatCompletionMessageParam } from "openai/resources/index";

const QUESTIONS = [
    "佐藤さんの過去の予約を意教えてください",
    "2025-08-26は誰が空いていますか？",
    "今日の予定を教えて",
    "今月の売上げと昨対比を教えて",
    "エアコンの掃除方法を教えてください",
];

async function main() {
    const conn = await getConnection();
    let history: ChatCompletionMessageParam[] = [];

    console.log("=== Function Calling 全ツールテキスト ===\n");

    try {
        for (const question of QUESTIONS) {
            console.log(`\n 【質問】${question}`);
            console.log("ー".repeat(60));

            const { reply, history: next } = await chat(conn, question, history);
            history = next;

            console.log(`【回答】\n${reply}`);
        }
    } finally {
        await conn.end();
    }

    console.log("\n=== テスト完了 ===");
}

main().catch(console.error);