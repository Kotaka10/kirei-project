import { Connection, type RowDataPacket, type ResultSetHeader } from "mysql2/promise";
import type { UserContext } from "../../types/auth.js";

export async function getCustomerBookings(
    conn: Connection,
    args: { customer_name?: string; customer_id?: number; limit?: number },
    ctx: UserContext
): Promise<object> {
    const limit = args.limit ?? 5;
    const params: any[] = [];
    const conditions: string[] = [];

    if (args.customer_id) {
        conditions.push("c.id = ?");
        params.push(args.customer_id);
    } else if (args.customer_name) {
        conditions.push("c.name LIKE ?");
        params.push(`%${args.customer_name}%`);
    } else {
        return { error: "customer_name または customer_id を指定してください" };
    }

    if (ctx.role !== "supervisor") {
        conditions.push("b.staff_id = ?");
        params.push(ctx.staffId);
    }

    const where = conditions.join(" AND ");

    const [rows] = await conn.query<RowDataPacket[]>(
        `SELECT
        c.name        AS customer_name,
        b.service_type,
        b.scheduled_at,
        b.status,
        b.price,
        s.name        AS staff_name
        FROM bookings b
        JOIN customers c ON b.customer_id = c.id
        LEFT JOIN staffs s ON b.staff_id = s.id
        WHERE ${where}
        ORDER BY b.scheduled_at DESC
        LIMIT ?`,
        [...params, limit]
    );

    if (rows.length === 0) return { message: "該当する予約履歴が見つかりませんでした" };
    return { bookings: rows };
}

export async function requestStaffAssignment(
    conn: Connection,
    args: {
        date:              string;
        target_staff_name: string;
        service_type?:     string;
        customer_name?:    string;
        booking_id?:       number;
        note?:             string;
    },
    ctx: UserContext
): Promise<object> {
    // 追加対象スタッフを名前で検索
    const [staffRows] = await conn.query<RowDataPacket[]>(
        `SELECT id, name, role FROM staffs WHERE name LIKE ? AND is_active = true`,
        [`%${args.target_staff_name}%`]
    );
    if (staffRows.length === 0) {
        return { error: `「${args.target_staff_name}」に該当するスタッフが見つかりませんでした` };
    }
    if (staffRows.length > 1) {
        return {
            error:      "名前が複数のスタッフに一致しました。フルネームで指定してください",
            candidates: staffRows.map(s => s.name),
        };
    }
    const targetStaff = staffRows[0]!;

    // ジョブを特定
    let booking: RowDataPacket;
    if (args.booking_id) {
        const [rows] = await conn.query<RowDataPacket[]>(
            `SELECT b.id, b.service_type, b.scheduled_at, c.name AS customer_name
             FROM bookings b JOIN customers c ON b.customer_id = c.id
             WHERE b.id = ? AND b.status != 'cancelled'`,
            [args.booking_id]
        );
        if (rows.length === 0) {
            return { error: `booking_id: ${args.booking_id} のジョブが見つかりませんでした` };
        }
        booking = rows[0]!;
    } else {
        const conditions: string[] = ["DATE(b.scheduled_at) = ?", "b.status != 'cancelled'"];
        const params: any[] = [args.date];
        if (args.service_type)  { conditions.push("b.service_type LIKE ?"); params.push(`%${args.service_type}%`); }
        if (args.customer_name) { conditions.push("c.name LIKE ?");         params.push(`%${args.customer_name}%`); }

        const [rows] = await conn.query<RowDataPacket[]>(
            `SELECT b.id, b.service_type, b.scheduled_at, c.name AS customer_name
             FROM bookings b JOIN customers c ON b.customer_id = c.id
             WHERE ${conditions.join(" AND ")} ORDER BY b.scheduled_at`,
            params
        );
        if (rows.length === 0) {
            return { error: `${args.date}に該当するジョブが見つかりませんでした` };
        }
        if (rows.length > 1) {
            return {
                message: "複数のジョブが見つかりました。どのジョブに追加しますか？",
                jobs:    rows.map(b => ({
                    booking_id:    b.id,
                    service_type:  b.service_type,
                    customer_name: b.customer_name,
                    scheduled_at:  b.scheduled_at,
                })),
            };
        }
        booking = rows[0]!;
    }

    // 重複チェック
    const [dupPrimary] = await conn.query<RowDataPacket[]>(
        `SELECT id FROM bookings WHERE id = ? AND staff_id = ?`,
        [booking.id, targetStaff.id]
    );
    const [dupRequest] = await conn.query<RowDataPacket[]>(
        `SELECT id FROM assignment_requests WHERE booking_id = ? AND target_staff_id = ? AND status != 'rejected'`,
        [booking.id, targetStaff.id]
    );
    if (dupPrimary.length > 0 || dupRequest.length > 0) {
        return { error: `${targetStaff.name}さんはすでにこのジョブに割り当て済みまたは承認待ちです` };
    }

    const [result] = await conn.execute<ResultSetHeader>(
        `INSERT INTO assignment_requests (booking_id, target_staff_id, requested_by, note) VALUES (?, ?, ?, ?)`,
        [booking.id, targetStaff.id, ctx.staffId, args.note ?? null]
    );

    return {
        success:      true,
        request_id:   result.insertId,
        message:      `${targetStaff.name}さんを「${booking.service_type}」（${booking.customer_name}）に追加するリクエストを送信しました。管理者の承認後に正式割り当てとなります。`,
        target_staff: targetStaff.name,
        job:          booking.service_type,
        customer:     booking.customer_name,
        date:         args.date,
    };
}
