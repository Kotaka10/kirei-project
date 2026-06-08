import type OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources";

export const OUT_OF_SCOPE_REPLY =
    "申し訳ありませんが、このAIアシスタントは清掃業務と、このシステムに実装済みの機能に関する質問にのみ対応できます。";

const SCOPE_GUARD_PROMPT = `あなたは清掃・メンテナンスサービス会社の社内AIアシスタントの入力範囲を判定する分類器です。

許可する質問:
- 清掃・メンテナンス会社の業務に関する質問
- 予約、スケジュール、スタッフ、空き状況、割り当て、スキル、顧客、作業履歴に関する質問
- 清掃の資材、道具、購入先、作業ノウハウ、現場対応に関する質問
- 見積もり、営業トーク、訪問見積もり、案件、売上、書類作成に関する質問
- このAIアシスタントに実装済みの機能に関する質問
- 直前の会話で扱っている業務内容への確認、保存、修正、要約、続きの依頼
- 短い挨拶や業務利用に必要な確認

拒否する質問:
- 清掃業務や実装済み機能と関係ない一般知識、雑学、ニュース、天気、スポーツ、芸能、歴史、旅行、料理、医療、法律、金融、プログラミング一般など
- 業務文脈なしの個人的な相談や娯楽目的の質問

判定に迷う場合は、直前の会話が清掃業務または実装済み機能に関係しているなら許可してください。
必ずJSONだけで返してください: {"allowed":true} または {"allowed":false}`;

export async function isAllowedAiQuestion(
    openai: OpenAI,
    userMessage: string,
    history: ChatCompletionMessageParam[],
): Promise<boolean> {
    try {
        const res = await openai.chat.completions.create({
            model:       "gpt-4o-mini",
            messages: [
                { role: "system", content: SCOPE_GUARD_PROMPT },
                {
                    role:    "user",
                    content: `直近の会話:\n${formatHistoryForScopeCheck(history)}\n\n判定対象のユーザー発言:\n${userMessage}`,
                },
            ],
            temperature:     0,
            max_tokens:      40,
            response_format: { type: "json_object" },
        });

        const parsed = JSON.parse(res.choices[0]?.message?.content ?? "{}") as { allowed?: unknown };
        return parsed.allowed === true;
    } catch {
        return true;
    }
}

function formatHistoryForScopeCheck(history: ChatCompletionMessageParam[]): string {
    const lines = history
        .filter(message => message.role === "user" || message.role === "assistant")
        .slice(-8)
        .map(message => {
            const label = message.role === "user" ? "ユーザー" : "AI";
            return `${label}: ${normalizeContent(message.content)}`;
        })
        .filter(line => line.trim().length > 0);

    return lines.length > 0 ? lines.join("\n") : "なし";
}

function normalizeContent(content: ChatCompletionMessageParam["content"]): string {
    if (typeof content === "string") return content.slice(0, 300);
    if (!content) return "";
    if (Array.isArray(content)) {
        return content
            .map(part => {
                if (typeof part === "string") return part;
                if ("text" in part && typeof part.text === "string") return part.text;
                return "";
            })
            .join(" ")
            .slice(0, 300);
    }
    return "";
}
