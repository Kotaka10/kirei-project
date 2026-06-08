import { z } from "zod";

export const AiQuestionSourceSchema = z.enum(["history", "schedule", "role", "service", "fallback"]);
export type AiQuestionSource = z.infer<typeof AiQuestionSourceSchema>;

export const AiQuestionSuggestionSchema = z.object({
    question: z.string().min(1),
    source:   AiQuestionSourceSchema,
});
export type AiQuestionSuggestion = z.infer<typeof AiQuestionSuggestionSchema>;

export const AiQuestionResponseSchema = z.object({
    questions: z.array(AiQuestionSuggestionSchema),
});
export type AiQuestionResponse = z.infer<typeof AiQuestionResponseSchema>;

export const FALLBACK_AI_QUESTIONS: AiQuestionSuggestion[] = [
    { question: "今日の自分のスケジュールを教えて", source: "fallback" },
    { question: "明日空いているスタッフは？", source: "fallback" },
    { question: "エアコン5台のオフィスで汚れありの概算は？", source: "fallback" },
    { question: "新規顧客への営業トークを教えて", source: "fallback" },
];
