import { z } from "zod";

export const CreateCaseSchema = z.object({
    summary: z.string().min(10, "概要は10文字以上入力してください").max(2000, "2000文字以内で入力してください"),
});

export const UpdateCaseStatusSchema = z.object({
    status: z.enum(["open", "in_progress", "closed"]),
});

export interface CaseRecord {
    id: number;
    title: string;
    summary: string;
    document: string | null;
    status: "open" | "in_progress" | "closed";
    required_roles: string[] | null;
    created_by: number;
    created_by_name?: string;
    created_at: string;
    updated_at: string;
}

export interface CaseNotificationRecord {
    id: number;
    case_id: number;
    staff_id: number;
    is_read: boolean;
    created_at: string;
    case_title?: string;
    case_summary?: string;
    case_status?: string;
    case_document?: string | null;
    case_created_at?: string;
}

export interface NotifiedStaff {
    staff_id: number;
    name: string;
    role: string;
}