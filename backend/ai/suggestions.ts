import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources";

export async function generateSuggestions(
    openai: OpenAI,
    messages: ChatCompletionMessageParam[],
    availableServices: string[] = [],
): Promise<string[]> {
    const serviceHint = availableServices.length > 0
        ? `\n【対応サービス一覧】${availableServices.join("、")}\n` +
          "見積もり・概算・営業トーク関連の会話の場合も、直近の回答から自然につながるサービスだけを提案に含めること。"
        : "";

    try {
        const res = await openai.chat.completions.create({
            model:       "gpt-4o-mini",
            messages: [
                ...messages.slice(-8),
                {
                    role:    "user",
                    content: "直近のAI回答を最優先にして、ユーザーが次に聞きたいこと・やりたいことを3つ予測して短いボタンラベルで提案してください。" +
                             serviceHint +
                             "最近よく質問される内容や一般的な人気質問は混ぜず、直近の回答に直接つながる提案だけにしてください。" +
                             "直近の回答で概算金額・見積もり金額を提示した場合は、必要に応じて「見積書を作成して」「見積もりを保存して」など、次の実務を手助けする提案を含めてください。" +
                             "提案は清掃・メンテナンス会社の業務、またはこのAIアシスタントに実装済みの機能に関する内容だけに限定してください。" +
                             "関係ない一般知識、雑談、ニュース、天気、娯楽、プログラミング一般などの提案は含めないでください。" +
                             "必ず以下のJSON形式のみで返してください（他のテキスト不要）: {\"suggestions\":[\"提案1\",\"提案2\",\"提案3\"]}。各提案は20文字以内の日本語。",
                },
            ],
            temperature:     0.6,
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
