import { Connection, type RowDataPacket } from "mysql2/promise";
import type { UserContext } from "../../types/auth.js";

export async function getSalesSummary(
    conn: Connection,
    args: { period: string; year?: number; month?: number },
    ctx: UserContext
): Promise<object> {
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
