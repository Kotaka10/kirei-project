export interface ChatSession {
    id:         number;
    title:      string;
    created_at: string;
    updated_at: string;
}

export interface SessionMessage {
    id:          number;
    session_id:  number;
    role:        "user" | "assistant";
    content:     string;
    suggestions?: string[];
    created_at:  string;
}