export type AiQuestionSource = "history" | "schedule" | "role" | "service" | "fallback";

export interface AiQuestionSuggestion {
    question: string;
    source:   AiQuestionSource;
}

export interface AiQuestionResponse {
    questions: AiQuestionSuggestion[];
}

export interface FrequentQuestionRow {
    question:     string;
    usage_count:  number;
    last_used_at: string;
}

export interface RecentQuestionRow {
    content: string;
}

export interface UpcomingJobRow {
    id:            number;
    service_type:  string;
    date:          string;
    start_time:    string;
    customer_name: string;
    staff_name:    string | null;
}

export interface PopularServiceRow {
    service_type:  string;
    booking_count: number;
}