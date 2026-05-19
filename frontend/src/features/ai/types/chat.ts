import { z } from "zod";

// メッセージ型
export const MessageSchema = z.object({
    id: z.string(),
    role: z.enum(["user", "assistant"]),
    content: z.string().min(1),
    timestamp: z.date(),
});
export type Message = z.infer<typeof MessageSchema>;

// チャット送信リクエスト（入力バリデーション）
export const ChatRequestSchema = z.object({
    message: z.string()
        .min(1, "メッセージを入力してください")
        .max(500, "500文字以内で入力してください"),
    session_id: z.string().optional(), // optional → 省略可能の意味
});
export type ChatRequest = z.infer<typeof ChatRequestSchema>;

// APIレスポンス
export const ChatResponseSchema = z.object({
    reply:       z.string(),
    session_id:  z.string(),
});
export type ChatResponse = z.infer<typeof ChatResponseSchema>;

// よく使う質問（サジェスト）
export const SUGGESTED_QUESTIONS = [
    "今月のスケジュールを教えて",
    "今月の売上げと昨対比は？",
    "佐藤さんの過去の予約を確認したい",
    "エアコン清掃の方法を教えて",
    "明日空いているスタッフは？",
] as const;