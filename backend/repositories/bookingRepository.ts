import type { RowDataPacket } from "mysql2/promise";
import { Connection } from "mysql2/promise";

export interface BookingRecord {
    customer_name: string;
    service_type:  string;
    scheduled_at:  Date;
    status:        string;
    price:         number;
    staff_name:    string;
}

export class BookingRepository {
    async findByCustomerName(
        conn: Connection,
        customerName: string,
        staffId: number | null,   // null = supervisor（全件）
        limit: number
    ): Promise<BookingRecord[]> {
        const conditions: string[] = ["c.name LIKE ?"];
        const params: any[]        = [`%${customerName}%`];

        if (staffId !== null) {
            conditions.push("b.staff_id = ?");
            params.push(staffId);
        }

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
        WHERE ${conditions.join(" AND ")}
        ORDER BY b.scheduled_at DESC
        LIMIT ?`,
        [...params, limit]
    );

        return rows as BookingRecord[];
    }

    async findByCustomerId(
        conn: Connection,
        customerId: number,
        staffId: number | null,
        limit: number
    ): Promise<BookingRecord[]> {
        const conditions: string[] = ["c.id = ?"];
        const params: any[]        = [customerId];

        if (staffId !== null) {
            conditions.push("b.staff_id = ?");
            params.push(staffId);
        }

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
        WHERE ${conditions.join(" AND ")}
        ORDER BY b.scheduled_at DESC
        LIMIT ?`,
        [...params, limit]
    );

    return rows as BookingRecord[];
    }
}