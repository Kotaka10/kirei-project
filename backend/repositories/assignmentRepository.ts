import type { Connection, RowDataPacket, ResultSetHeader } from "mysql2/promise";

export interface AssignmentRequest {
    id:                 number;
    booking_id:         number;
    service_type:       string;
    scheduled_at:       string;
    customer_name:      string;
    target_staff_id:    number;
    target_staff_name:  string;
    requested_by:       number;
    requested_by_name:  string;
    status:             "pending" | "approved" | "rejected";
    note:               string | null;
    created_at:         string;
    approved_by:        number | null;
    approved_by_name:   string | null;
    approved_at:        string | null;
}

const SELECT_FIELDS = `
    ar.id, ar.booking_id, ar.target_staff_id, ar.requested_by,
    ar.status, ar.note, ar.created_at, ar.approved_by, ar.approved_at,
    b.service_type, b.scheduled_at,
    c.name  AS customer_name,
    ts.name AS target_staff_name,
    rs.name AS requested_by_name,
    ab.name AS approved_by_name
`;

const BASE_JOIN = `
    FROM assignment_requests ar
    JOIN bookings b   ON ar.booking_id      = b.id
    JOIN customers c  ON b.customer_id      = c.id
    JOIN staffs ts    ON ar.target_staff_id  = ts.id
    JOIN staffs rs    ON ar.requested_by     = rs.id
    LEFT JOIN staffs ab ON ar.approved_by   = ab.id
`;

export class AssignmentRepository {
    async create(
        conn: Connection,
        data: { booking_id: number; target_staff_id: number; requested_by: number; note?: string }
    ): Promise<number> {
        const [result] = await conn.execute<ResultSetHeader>(
            `INSERT INTO assignment_requests (booking_id, target_staff_id, requested_by, note)
             VALUES (?, ?, ?, ?)`,
            [data.booking_id, data.target_staff_id, data.requested_by, data.note ?? null]
        );
        return result.insertId;
    }

    async findById(conn: Connection, id: number): Promise<AssignmentRequest | null> {
        const [rows] = await conn.query<RowDataPacket[]>(
            `SELECT ${SELECT_FIELDS} ${BASE_JOIN} WHERE ar.id = ?`,
            [id]
        );
        return (rows[0] as AssignmentRequest) ?? null;
    }

    async findAll(
        conn: Connection,
        filters: { status?: string; requestedBy?: number }
    ): Promise<AssignmentRequest[]> {
        const conditions: string[] = [];
        const params: any[] = [];

        if (filters.status) {
            conditions.push("ar.status = ?");
            params.push(filters.status);
        }
        if (filters.requestedBy) {
            conditions.push("ar.requested_by = ?");
            params.push(filters.requestedBy);
        }

        const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
        const [rows] = await conn.query<RowDataPacket[]>(
            `SELECT ${SELECT_FIELDS} ${BASE_JOIN} ${where} ORDER BY ar.created_at DESC`,
            params
        );
        return rows as AssignmentRequest[];
    }

    async countPending(conn: Connection): Promise<number> {
        const [rows] = await conn.query<RowDataPacket[]>(
            `SELECT COUNT(*) AS cnt FROM assignment_requests WHERE status = 'pending'`
        );
        return Number(rows[0]?.cnt ?? 0);
    }

    async updateStatus(
        conn: Connection,
        id: number,
        status: "approved" | "rejected",
        approvedBy: number
    ): Promise<void> {
        await conn.execute(
            `UPDATE assignment_requests SET status = ?, approved_by = ?, approved_at = NOW() WHERE id = ?`,
            [status, approvedBy, id]
        );
    }

    /** 承認後にスケジュールテーブルへ反映する */
    async reflectInSchedule(
        conn: Connection,
        bookingId: number,
        targetStaffId: number
    ): Promise<void> {
        // ① 既存スロットから日時を取得（同じ booking にリンクされているスロット）
        const [existingSlots] = await conn.query<RowDataPacket[]>(
            `SELECT date, start_time, end_time FROM schedules WHERE booking_id = ? LIMIT 1`,
            [bookingId]
        );

        let dateStr: string;
        let startTime: string;
        let endTime: string;

        if (existingSlots.length > 0) {
            const slot = existingSlots[0]!;
            // DATE 列は mysql2 が Date オブジェクトで返す場合がある
            dateStr   = slot.date instanceof Date
                ? slot.date.toISOString().slice(0, 10)
                : String(slot.date).slice(0, 10);
            startTime = String(slot.start_time);
            endTime   = String(slot.end_time);
        } else {
            // フォールバック: booking の scheduled_at から導出（1時間枠）
            const [bookingRows] = await conn.query<RowDataPacket[]>(
                `SELECT scheduled_at FROM bookings WHERE id = ?`,
                [bookingId]
            );
            if (bookingRows.length === 0) return;
            const dt = new Date(bookingRows[0]!.scheduled_at as string | Date);
            dateStr   = dt.toISOString().slice(0, 10);
            startTime = dt.toTimeString().slice(0, 8); // HH:MM:SS
            endTime   = new Date(dt.getTime() + 3_600_000).toTimeString().slice(0, 8);
        }

        // ② 対象スタッフの「available」スロットを優先して検索（booked スロットは上書きしない）
        const [availableSlots] = await conn.query<RowDataPacket[]>(
            `SELECT id FROM schedules WHERE staff_id = ? AND date = ? AND start_time = ? AND status = 'available'`,
            [targetStaffId, dateStr, startTime]
        );

        if (availableSlots.length > 0) {
            // available スロットを booked に更新
            await conn.execute(
                `UPDATE schedules SET status = 'booked', booking_id = ? WHERE id = ?`,
                [bookingId, availableSlots[0]!.id]
            );
        } else {
            // スロットがない（または既に他の予約で booked）場合は新規作成
            await conn.execute(
                `INSERT INTO schedules (staff_id, date, start_time, end_time, status, booking_id)
                 VALUES (?, ?, ?, ?, 'booked', ?)`,
                [targetStaffId, dateStr, startTime, endTime, bookingId]
            );
        }
    }
}
