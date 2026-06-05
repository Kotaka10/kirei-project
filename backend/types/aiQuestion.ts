export type AiQuestionSource = "history" | "schedule" | "role" | "service" | "fallback";

export interface AiQuestionSuggestion {
    question: string;
    source:   AiQuestionSource;
}

export interface AiQuestionResponse {
    questions: AiQuestionSuggestion[];
}
