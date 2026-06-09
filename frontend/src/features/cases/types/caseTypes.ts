export interface CaseRecord {
    id: number;
    title: string;
    summary: string;
    document: string | null;
    status: "open" | "in_progress" | "closed";
    required_roles: string[] | null;
    required_level: number | null;
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
    case_required_level?: number | null;
    case_created_at?: string;
}

export interface NotifiedStaff {
    staff_id: number;
    name: string;
    role: string;
    level: number;
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

// 案件の難易度レベル（AIが内容から自動判別）。スタッフの保有スキルレベルと突き合わせて通知される
export const LEVEL_LABEL: Record<number, string> = {
    1: "見習い",
    2: "初級",
    3: "中級",
    4: "上級",
    5: "エキスパート",
};

export const LEVEL_COLOR: Record<number, string> = {
    1: "bg-gray-100 text-gray-600",
    2: "bg-teal-100 text-teal-700",
    3: "bg-indigo-100 text-indigo-700",
    4: "bg-orange-100 text-orange-700",
    5: "bg-rose-100 text-rose-700",
};

export function levelLabel(level: number | null | undefined): string {
    if (level == null) return "未判定";
    return `Lv${level}・${LEVEL_LABEL[level] ?? "—"}`;
}
