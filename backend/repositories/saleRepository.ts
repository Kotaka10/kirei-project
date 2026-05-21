import type { RowDataPacket } from "mysql2/promise";
import { Connection } from "mysql2/promise";

export interface SalesRecord {
    total_amount:  number;
    booking_count: number;
}

export class SalesRepository {
    async findByDateCondition(
        conn: Connection,
        dateCondition: string
    ): Promise<SalesRecord> {
        const [rows] = await conn.query<RowDataPacket[]>(
            `SELECT
                COALESCE(SUM(total_amount), 0)  AS total_amount,
                COALESCE(SUM(booking_count), 0) AS booking_count
            FROM sales
            WHERE ${dateCondition}`
        );
        return {
            total_amount:  Number(rows[0]?.total_amount),
            booking_count: Number(rows[0]?.booking_count),
        };
    }

    async findByYearMonth(
        conn: Connection,
        year: number,
        month: number
    ): Promise<SalesRecord> {
        const [rows] = await conn.query<RowDataPacket[]>(
            `SELECT
                COALESCE(SUM(total_amount), 0)  AS total_amount,
                COALESCE(SUM(booking_count), 0) AS booking_count
            FROM sales
            WHERE YEAR(date) = ? AND MONTH(date) = ?`,
            [year, month]
        );
        return {
            total_amount:  Number(rows[0]?.total_amount),
            booking_count: Number(rows[0]?.booking_count),
        };
    }
}