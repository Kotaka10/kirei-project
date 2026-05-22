import { Connection, type RowDataPacket } from "mysql2/promise";
import type { UserContext } from "../types/auth.js";

// ① 顧客の過去予約
export async function getCustomerBookings(
    conn: Connection,
    args: { customer_name?: string; customer_id?: number; limit?: number },
    ctx: UserContext
): Promise<object> {
    const limit = args.limit ?? 5;
    const params: any[] = [];
    const conditions: string[] = [];

  // 顧客の絞り込み
    if (args.customer_id) {
        conditions.push("c.id = ?");
        params.push(args.customer_id);
    } else if (args.customer_name) {
        conditions.push("c.name LIKE ?");
        params.push(`%${args.customer_name}%`);
    } else {
        return { error: "customer_name または customer_id を指定してください" };
    }

    // 権限フィルター
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

// ② スタッフ空き確認
export async function checkStaffAvailability(
    conn: Connection,
    args: { date: string; staff_name?: string },
    ctx: UserContext
): Promise<object> {
    // 祝日・繁忙期チェック
    const [holidayRows] = await conn.query<RowDataPacket[]>(
        `SELECT name, is_busy FROM holidays WHERE date = ?`,
        [args.date]
    );

    const params: any[] = [args.date];
    const conditions: string[] = ["sc.date = ?", "s.is_active = true"];

    // 権限フィルター
    if (ctx.role !== "supervisor") {
        // 一般スタッフは自分のスケジュールのみ
        conditions.push("sc.staff_id = ?");
        params.push(ctx.staffId);
    } else if (args.staff_name) {
        // supervisorが特定スタッフを指定した場合
        conditions.push("s.name LIKE ?");
        params.push(`%${args.staff_name}%`);
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
    };
}

// ③ スケジュール確認
export async function getSchedule(
    conn: Connection,
    args: { date?: string },
    ctx: UserContext
): Promise<object> {
    const targetDate = args.date ?? new Date().toISOString().slice(0, 10);

    const params: any[] = [targetDate];
    const conditions: string[] = ["sc.date = ?"];

    // 権限フィルター
    if (ctx.role !== "supervisor") {
        conditions.push("sc.staff_id = ?");
        params.push(ctx.staffId);
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

    const [holidayRows] = await conn.query<RowDataPacket[]>(
        `SELECT name, is_busy FROM holidays WHERE date = ?`,
        [targetDate]
    );

    return {
        date:          targetDate,
        viewer:        ctx.name,       // 誰が見ているか明示
        holiday:       holidayRows[0] ?? null,
        total:         rows.length,
        booked_count:  rows.filter((r) => r.status === "booked").length,
        schedules:     rows,
    };
}

// ④ 売上・昨対比
export async function getSalesSummary(
    conn: Connection,
    args: { period: string; year?: number; month?: number },
    ctx: UserContext
): Promise<object> {
    // 権限チェック
    if (ctx.role !== "supervisor") {
        return { error: "売上データは管理者のみ閲覧できます" };
    }

    const now   = new Date();
    const year  = args.year  ?? now.getFullYear();
    const month = args.month ?? (now.getMonth() + 1);

    let dateCondition: string;
    switch (args.period) {
        case "today":
        dateCondition = `date = '${now.toISOString().slice(0, 10)}'`;
        break;
        case "this_week": {
        const monday = new Date(now);
        monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
        dateCondition = `date >= '${monday.toISOString().slice(0, 10)}'`;
        break;
        }
        case "this_month":
        dateCondition = `YEAR(date) = ${year} AND MONTH(date) = ${month}`;
        break;
        case "last_month": {
        const lm = month === 1 ? 12 : month - 1;
        const ly = month === 1 ? year - 1 : year;
        dateCondition = `YEAR(date) = ${ly} AND MONTH(date) = ${lm}`;
        break;
        }
        default:
        return { error: "不正なperiodです" };
    }

    const [current] = await conn.query<RowDataPacket[]>(
        `SELECT
        COALESCE(SUM(total_amount), 0)  AS total_amount,
        COALESCE(SUM(booking_count), 0) AS booking_count
        FROM sales WHERE ${dateCondition}`
    );

    let yoy = null;
    if (args.period === "this_month" || args.period === "last_month") {
        const targetMonth = args.period === "last_month" ? (month === 1 ? 12 : month - 1) : month;
        const targetYear  = args.period === "last_month" ? (month === 1 ? year - 1 : year) : year;

        const [prev] = await conn.query<RowDataPacket[]>(
        `SELECT COALESCE(SUM(total_amount), 0) AS total_amount
        FROM sales WHERE YEAR(date) = ? AND MONTH(date) = ?`,
        [targetYear - 1, targetMonth]
        );

        const curr = Number(current[0]?.total_amount);
        const pre  = Number(prev[0]?.total_amount);
        yoy = {
        prev_year_amount:  pre,
        yoy_ratio_percent: pre > 0 ? Math.round((curr / pre) * 100) : null,
        diff:              curr - pre,
        };
    }

    return {
        period:        args.period,
        total_amount:  Number(current[0]?.total_amount),
        booking_count: Number(current[0]?.booking_count),
        yoy,
    };
}