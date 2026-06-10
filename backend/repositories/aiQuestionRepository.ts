import type { Connection, RowDataPacket } from "mysql2/promise";
import type { UserContext } from "../types/auth.js";
import type { FrequentQuestionRow, PopularServiceRow, RecentQuestionRow, UpcomingJobRow } from "../types/aiQuestion.js";

export class AiQuestionRepository {
    async findFrequentQuestions(
        conn:          Connection,
        limit = 8,
        minUsageCount = 2,
    ): Promise<FrequentQuestionRow[]> {
        const [rows] = await conn.query<RowDataPacket[]>(
            `SELECT
                TRIM(cm.content) AS question,
                COUNT(*)         AS usage_count,
                MAX(cm.created_at) AS last_used_at
             FROM chat_messages cm
             WHERE cm.role = 'user'
               AND CHAR_LENGTH(TRIM(cm.content)) BETWEEN 4 AND 60
             GROUP BY TRIM(cm.content)
             HAVING usage_count >= ?
             ORDER BY usage_count DESC, last_used_at DESC
             LIMIT ?`,
            [minUsageCount, limit],
        );
        return rows as FrequentQuestionRow[];
    }

    async findRecentUserQuestions(
        conn:    Connection,
        staffId: number,
        limit = 12,
    ): Promise<RecentQuestionRow[]> {
        const [rows] = await conn.query<RowDataPacket[]>(
            `SELECT TRIM(cm.content) AS content
             FROM chat_messages cm
             JOIN chat_sessions cs ON cm.session_id = cs.id
             WHERE cs.staff_id = ?
               AND cm.role = 'user'
               AND CHAR_LENGTH(TRIM(cm.content)) BETWEEN 4 AND 100
             ORDER BY cm.created_at DESC
             LIMIT ?`,
            [staffId, limit],
        );
        return rows as RecentQuestionRow[];
    }

    async findUpcomingJobs(
        conn:     Connection,
        ctx:      UserContext,
        fromDate: string,
        toDate:   string,
        limit = 5,
    ): Promise<UpcomingJobRow[]> {
        const conditions = [
            "DATE(b.scheduled_at) BETWEEN ? AND ?",
            "b.status <> 'cancelled'",
        ];
        const params: Array<string | number> = [fromDate, toDate]; //fromdate, todateがそれぞれ？に入る

        if (ctx.role !== "supervisor") {
            conditions.push(
                `(b.staff_id = ? OR EXISTS (
                    SELECT 1
                    FROM schedules sc
                    WHERE sc.booking_id = b.id AND sc.staff_id = ?
                ))`,
            );
            params.push(ctx.staffId, ctx.staffId);
        }

        params.push(limit);

        const [rows] = await conn.query<RowDataPacket[]>(
            `SELECT
                b.id,
                b.service_type,
                DATE_FORMAT(b.scheduled_at, '%Y-%m-%d') AS date,
                TIME_FORMAT(b.scheduled_at, '%H:%i')    AS start_time,
                c.name AS customer_name,
                s.name AS staff_name
             FROM bookings b
             JOIN customers c   ON b.customer_id = c.id
             LEFT JOIN staffs s ON b.staff_id = s.id
             WHERE ${conditions.join(" AND ")}
             ORDER BY b.scheduled_at ASC
             LIMIT ?`,
            params,
        );
        return rows as UpcomingJobRow[];
    }

    async findPopularServiceTypes(
        conn:  Connection,
        ctx:   UserContext,
        limit = 5,
    ): Promise<PopularServiceRow[]> {
        const conditions = ["b.status <> 'cancelled'", "b.service_type IS NOT NULL"];
        const params: Array<string | number> = [];

        if (ctx.role !== "supervisor") {
            conditions.push(
                `(b.staff_id = ? OR EXISTS (
                    SELECT 1
                    FROM schedules sc
                    WHERE sc.booking_id = b.id AND sc.staff_id = ?
                ))`,
            );
            params.push(ctx.staffId, ctx.staffId);
        }

        params.push(limit);

        const [rows] = await conn.query<RowDataPacket[]>(
            `SELECT b.service_type, COUNT(*) AS booking_count
             FROM bookings b
             WHERE ${conditions.join(" AND ")}
             GROUP BY b.service_type
             ORDER BY booking_count DESC, b.service_type ASC
             LIMIT ?`,
            params,
        );
        return rows as PopularServiceRow[];
    }
}
