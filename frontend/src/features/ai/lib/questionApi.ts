import { AiQuestionResponseSchema, type AiQuestionSuggestion } from "../types/aiQuestionTypes";

const API_BASE = import.meta.env.VITE_API_URL ?? "https://waviness-unsightly-freely.ngrok-free.dev";

export async function fetchFrequentQuestions(token: string): Promise<AiQuestionSuggestion[]> {
    const res = await fetch(`${API_BASE}/api/ai/questions/frequent`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(body.error ?? `サーバーエラー（${res.status}）`);
    }

    const parsed = AiQuestionResponseSchema.safeParse(await res.json());
    if (!parsed.success) {
        throw new Error("質問候補の形式が不正です");
    }

    return parsed.data.questions;
}
