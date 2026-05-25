import type { Connection, RowDataPacket } from "mysql2/promise";

export interface JobRecord {
    id:                  number;
    service_type:        string;
    scheduled_at:        string;
    status:              string;
    price:               number;
    customer_name:       string;
    primary_staff_id:    number | null;
    primary_staff_name:  string | null;
    additional_staff:    { staff_id: number; staff_name: string; assignment_id: number }[];
}

export interface StaffRecord {
    id:   number;
    name: string;
    role: string;
}

export class JobRepository {
    async findByDate(conn: Connection, date: string): Promise<JobRecord[]> {
        const [bookings] = await conn.query<RowDataPacket[]>(
            `SELECT
                b.id,
                b.service_type,
                b.scheduled_at,
                b.status,
                b.price,
                c.name  AS customer_name,
                s.id    AS primary_staff_id,
                s.name  AS primary_staff_name
             FROM bookings b
             JOIN customers c   ON b.customer_id = c.id
             LEFT JOIN staffs s ON b.staff_id    = s.id
             WHERE DATE(b.scheduled_at) = ?
             ORDER BY b.scheduled_at`,
            [date]
        );

        if (bookings.length === 0) return [];

        const bookingIds   = bookings.map(b => b.id);
        const placeholders = bookingIds.map(() => "?").join(",");

        const [assignments] = await conn.query<RowDataPacket[]>(
            `SELECT ar.booking_id, ar.id AS assignment_id, ts.id AS staff_id, ts.name AS staff_name
             FROM assignment_requests ar
             JOIN staffs ts ON ar.target_staff_id = ts.id
             WHERE ar.booking_id IN (${placeholders}) AND ar.status = 'approved'`,
            bookingIds
        );

        const assignMap = new Map<number, { staff_id: number; staff_name: string; assignment_id: number }[]>();
        for (const a of assignments) {
            if (!assignMap.has(a.booking_id)) assignMap.set(a.booking_id, []);
            assignMap.get(a.booking_id)!.push({
                staff_id:      a.staff_id,
                staff_name:    a.staff_name,
                assignment_id: a.assignment_id,
            });
        }

        return bookings.map(b => ({
            ...(b as JobRecord),
            additional_staff: assignMap.get(b.id) ?? [],
        }));
    }

    async findAllActiveStaff(conn: Connection): Promise<StaffRecord[]> {
        const [rows] = await conn.query<RowDataPacket[]>(
            `SELECT id, name, role FROM staffs WHERE is_active = true ORDER BY name`
        );
        return rows as StaffRecord[];
    }
}
