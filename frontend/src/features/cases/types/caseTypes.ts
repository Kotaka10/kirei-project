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

export interface CaseNotification {
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

export interface CreateCaseResponse {
    case: CaseRecord;
    notifiedStaff: NotifiedStaff[];
    push?: {
        provider: "onesignal";
        attempted: number;
        succeeded: number;
        failed: number;
        errors: { staff_id: number; name: string; message: string }[];
    };
}

export const STATUS_LABEL: Record<string, string> = {
    open: "未対応",
    in_progress: "対応中",
    closed: "完了",
};

export const STATUS_COLOR: Record<string, string> = {
    open: "bg-yellow-100 text-yellow-800",
    in_progress: "bg-blue-100 text-blue-800",
    closed: "bg-green-100 text-green-800",
};

export const ROLE_LABEL: Record<string, string> = {
    cleaner: "清掃員",
    technician: "技術者",
    supervisor: "監督者",
};
