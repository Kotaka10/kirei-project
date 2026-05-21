import type { RowDataPacket } from "mysql2/promise";
import { Connection } from "mysql2/promise";

    export interface ScheduleRecord {
        start_time:    string;
        end_time:      string;
        status:        string;
        staff_name:    string;
        staff_role:    string;
        customer_name: string | null;
        service_type:  string | null;
        price:         number | null;
    }

    export interface HolidayRecord {
        name:    string;
        is_busy: boolean;
    }

    export class ScheduleRepository {
        async findByDate(
            conn: Connection,
            date: string,
            staffId: number | null   // null = supervisor（全件）
        ): Promise<ScheduleRecord[]> {
            const conditions: string[] = ["sc.date = ?"];
            const params: any[]        = [date];

            if (staffId !== null) {
                conditions.push("sc.staff_id = ?");
                params.push(staffId);
            }

            const [rows] = await conn.query<RowDataPacket[]>(
            `SELECT
                sc.start_time,
                sc.end_time,
                sc.status,
                s.name        AS staff_name,
                s.role        AS staff_role,
                c.name        AS customer_name,
                b.service_type,
                b.price
            FROM schedules sc
            JOIN staffs s   ON sc.staff_id  = s.id
            LEFT JOIN bookings b  ON sc.booking_id = b.id
            LEFT JOIN customers c ON b.customer_id = c.id
            WHERE ${conditions.join(" AND ")}
            ORDER BY sc.start_time`,
            params
        );

        return rows as ScheduleRecord[];
    }

    async findAvailableByDate(
        conn: Connection,
        date: string,
        staffId: number | null,
        staffName?: string
    ): Promise<RowDataPacket[]> {
        const conditions: string[] = ["sc.date = ?", "s.is_active = true"];
        const params: any[]        = [date];

        if (staffId !== null) {
            conditions.push("sc.staff_id = ?");
            params.push(staffId);
        } else if (staffName) {
            conditions.push("s.name LIKE ?");
            params.push(`%${staffName}%`);
        }

        const [rows] = await conn.query<RowDataPacket[]>(
        `SELECT
            s.name       AS staff_name,
            s.role,
            sc.start_time,
            sc.end_time,
            sc.status
        FROM schedules sc
        JOIN staffs s ON sc.staff_id = s.id
        WHERE ${conditions.join(" AND ")}
        ORDER BY s.name, sc.start_time`,
        params
    );

    return rows;
    }

    async findHolidayByDate(
        conn: Connection,
        date: string
    ): Promise<HolidayRecord | null> {
        const [rows] = await conn.query<RowDataPacket[]>(
            `SELECT name, is_busy FROM holidays WHERE date = ? LIMIT 1`,
            [date]
        );
        return (rows[0] as HolidayRecord) ?? null;
    }
}