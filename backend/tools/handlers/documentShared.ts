import { Connection, type ResultSetHeader } from "mysql2/promise";

export const ISSUER = {
    name:           "株式会社キレイ",
    postal:         "〒100-0001",
    address:        "東京都千代田区大手町1-1-1",
    tel:            "03-0000-0000",
    email:          "info@kirei.co.jp",
    registrationNo: "T1234567890123",
};

export const TAX_RATE = 0.10;

export function buildDocumentNo(type: "EST" | "RPT" | "INV", id: number): string {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    return `${type}-${today}-${String(id).padStart(4, "0")}`;
}

export function formatDate(date: Date | string | null): string {
    if (!date) return "―";
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" });
}

export function addDays(days: number): string {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return formatDate(d);
}

export interface SaveDocParams {
    type:         "estimate" | "work_report" | "invoice";
    no:           string;
    title:        string;
    customerName: string;
    bookingId?:   number | undefined;
    estimateId?:  number | undefined;
    html:         string;
    totalAmount?: number | undefined;
    issuedBy:     number;
    notes?:       string | undefined;
}

export async function saveDocument(conn: Connection, params: SaveDocParams): Promise<number> {
    const [result] = await conn.execute<ResultSetHeader>(
        `INSERT INTO documents
            (document_type, document_no, title, customer_name, booking_id, estimate_id,
             content_html, total_amount, issued_by, notes, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft')`,
        [
            params.type,
            params.no,
            params.title,
            params.customerName,
            params.bookingId  ?? null,
            params.estimateId ?? null,
            params.html,
            params.totalAmount ?? null,
            params.issuedBy,
            params.notes ?? null,
        ]
    );
    return result.insertId;
}