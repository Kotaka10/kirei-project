import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources";

export async function generateSuggestions(
    openai: OpenAI,
    messages: ChatCompletionMessageParam[],
    availableServices: string[] = [],
): Promise<string[]> {
    const serviceHint = availableServices.length > 0
        ? `\n【対応サービス一覧】${availableServices.join("、")}\n` +
          "見積もり・概算・営業トーク関連の会話の場合、まだ触れていない他のサービスの概算や営業トークを積極的に提案に含めること。"
        : "";

    try {
        const res = await openai.chat.completions.create({
            model:       "gpt-4o-mini",
            messages: [
                ...messages.slice(-8),
                {
                    role:    "user",
                    content: "この会話の流れを踏まえ、ユーザーが次に聞きたいこと・やりたいことを3つ予測して短いボタンラベルで提案してください。" +
                             serviceHint +
                             "必ず以下のJSON形式のみで返してください（他のテキスト不要）: {\"suggestions\":[\"提案1\",\"提案2\",\"提案3\"]}。各提案は20文字以内の日本語。",
                },
            ],
            temperature:     0.4,
            max_tokens:      150,
            response_format: { type: "json_object" },
        });
        const parsed = JSON.parse(res.choices[0]?.message?.content ?? "{}") as { suggestions?: unknown };
        if (Array.isArray(parsed.suggestions)) {
            return (parsed.suggestions as unknown[])
                .filter((s): s is string => typeof s === "string")
                .slice(0, 3);
        }
        return [];
    } catch {
        return [];
    }
}