import { Connection, RowDataPacket } from "mysql2/promise";

export async function getCustomerBookings(
    conn: Connection,
    args: { customer_name?: string; customer_id?: number; limit?: number }
): Promise<object> {
    const limit = args.limit ?? 5;

    let whereClause = "";
    const params: any[] = [];

    if (args.customer_id) {
        whereClause = "c.id = ?";
        params.push(args.customer_id);
    } else if (args.customer_name) {
        whereClause = "c.name LIKE ?";
        params.push(`%${args.customer_name}%`);
    } else {
        return { error: "customer_name または customer_id を指定してください" };
    }

    const [rows] = await conn.query<RowDataPacket[]>(
        `SELECT
            c.name        AS customer_name,
            b.service_type,
            b.scheduled_at,
            b.status,
            b.price,
            s.name       AS staff_name
        FROM bookings b
        JOIN customers c ON b.customer_id = c.id
        LEFT JOIN staffs s ON b.staff_id = s.id
        WHERE ${whereClause}
        ORDER BY b.scheduled_at DESC
        LIMIT ?`,
        [...params, limit]
    );

    if (rows.length === 0) {
        return { message: "該当する予約履歴が見つかりませんでした"};
    }

    return { bookings: rows };
}
