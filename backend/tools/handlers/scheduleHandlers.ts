import { Connection, type RowDataPacket } from "mysql2/promise";
import type { UserContext } from "../../types/auth.js";
import { normalizeNameForSearch, stripSpacesExpr } from "./utils.js";

export async function checkStaffAvailability(
    conn: Connection,
    args: { date: string; staff_name?: string },
    _ctx: UserContext
): Promise<object> {
    const [holidayRows] = await conn.query<RowDataPacket[]>(
        `SELECT name, is_busy FROM holidays WHERE date = ?`,
        [args.date]
    );

    const params: any[] = [args.date];
    const conditions: string[] = ["sc.date = ?", "s.is_active = true"];

    if (args.staff_name) {
        conditions.push(`${stripSpacesExpr("s.name")} LIKE ?`);
        params.push(`%${normalizeNameForSearch(args.staff_name)}%`);
    }

    const [slots] = await conn.query<RowDataPacket[]>(
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

    const available = slots.filter((r) => r.status === "available");
    const booked    = slots.filter((r) => r.status === "booked");

    return {
        date:            args.date,
        holiday:         holidayRows[0] ?? null,
        available_count: available.length,
        available_slots: available,
        booked_count:    booked.length,
        booked_slots:    booked,
    };
}

export async function getSchedule(
    conn: Connection,
    args: { date?: string; start_date?: string; end_date?: string; service_type?: string; status?: string; staff_name?: string },
    ctx: UserContext
): Promise<object> {
    const today = new Date().toISOString().slice(0, 10);

    const params: any[] = [];
    const conditions: string[] = [];

    const isPeriod = !!(args.start_date && args.end_date);
    if (isPeriod) {
        conditions.push("sc.date BETWEEN ? AND ?");
        params.push(args.start_date, args.end_date);
    } else if (args.start_date) {
        conditions.push("sc.date >= ?");
        params.push(args.start_date);
    } else if (args.date) {
        conditions.push("sc.date = ?");
        params.push(args.date);
    } else if (args.status === "booked" || args.service_type) {
        conditions.push("sc.date >= ?");
        params.push(today);
    } else {
        conditions.push("sc.date = ?");
        params.push(today);
    }

    if (args.staff_name) {
        conditions.push(`${stripSpacesExpr("s.name")} LIKE ?`);
        params.push(`%${normalizeNameForSearch(args.staff_name)}%`);
    } else if (ctx.role !== "supervisor") {
        conditions.push("sc.staff_id = ?");
        params.push(ctx.staffId);
    }

    if (args.service_type) {
        conditions.push("b.service_type LIKE ?");
        params.push(`%${args.service_type}%`);
    }

    if (args.status) {
        conditions.push("sc.status = ?");
        params.push(args.status);
        if (args.status === "booked") {
            conditions.push("b.status != 'cancelled'");
        }
    } else if (args.service_type) {
        conditions.push("sc.status = 'booked'");
        conditions.push("b.status != 'cancelled'");
    }

    const [rows] = await conn.query<RowDataPacket[]>(
        `SELECT
        sc.date,
        sc.start_time,
        sc.end_time,
        sc.status,
        s.name        AS staff_name,
        s.role        AS staff_role,
        c.name        AS customer_name,
        b.id          AS booking_id,
        b.service_type,
        b.price
        FROM schedules sc
        JOIN staffs s   ON sc.staff_id  = s.id
        LEFT JOIN bookings b  ON sc.booking_id = b.id
        LEFT JOIN customers c ON b.customer_id = c.id
        WHERE ${conditions.join(" AND ")}
        ORDER BY sc.date, sc.start_time
        LIMIT 100`,
        params
    );

    const groupedMap = new Map<string, {
        date: string; start_time: string; end_time: string; status: string;
        customer_name: string | null; booking_id: number | null;
        service_type: string | null; price: number | null;
        staff_members: { name: string; role: string }[];
    }>();

    for (const row of rows) {
        if (row.booking_id) {
            const key = String(row.booking_id);
            if (!groupedMap.has(key)) {
                groupedMap.set(key, {
                    date:          row.date,
                    start_time:    row.start_time,
                    end_time:      row.end_time,
                    status:        row.status,
                    customer_name: row.customer_name,
                    booking_id:    row.booking_id,
                    service_type:  row.service_type,
                    price:         row.price,
                    staff_members: [{ name: row.staff_name, role: row.staff_role }],
                });
            } else {
                groupedMap.get(key)!.staff_members.push({ name: row.staff_name, role: row.staff_role });
            }
        } else {
            const key = `avail_${row.date}_${row.start_time}_${row.staff_name}`;
            groupedMap.set(key, {
                date:          row.date,
                start_time:    row.start_time,
                end_time:      row.end_time,
                status:        row.status,
                customer_name: null,
                booking_id:    null,
                service_type:  null,
                price:         null,
                staff_members: [{ name: row.staff_name, role: row.staff_role }],
            });
        }
    }

    const schedules = Array.from(groupedMap.values());

    let holiday = null;
    if (!isPeriod) {
        const targetDate = args.date ?? today;
        const [holidayRows] = await conn.query<RowDataPacket[]>(
            "SELECT name, is_busy FROM holidays WHERE date = ?",
            [targetDate]
        );
        holiday = holidayRows[0] ?? null;
    }

    const dateLabel = isPeriod
        ? `${args.start_date} 〜 ${args.end_date}`
        : args.start_date
            ? `${args.start_date} 以降`
            : args.date
                ? args.date
                : (args.status === "booked" || args.service_type)
                    ? `${today} 以降`
                    : today;

    return {
        date:         dateLabel,
        viewer:       ctx.name,
        holiday,
        total:        schedules.length,
        booked_count: schedules.filter(s => s.status === "booked").length,
        schedules,
    };
}
