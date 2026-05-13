import { Connection, RowDataPacket } from "mysql2/promise";

export async function generateSales(conn: Connection): Promise<void> {
    console.log("売上データ生成中...");

    await conn.query(`
        INSERT INTO sales (date, total_amount, booking_count)
        SELECT
            Date(scheduled_at) AS date,
            SUM(price)         AS total_amount,
            count(*)           AS booking_count
        FROM bookings
        WHERE status = 'completed'
        GROUP BY DATE(scheduled_at)
        ON DUPLICATE KEY UPDATE
            total_amount = VALUES(total_amount),
            booking_count = VALUES(booking_count)
    `);

    const [result] = await conn.query<RowDataPacket[]>(
        "SELECT COUNT(*) AS cnt FROM sales"
    );

    console.log(` ✔︎ sales: ${result[0].cnt}件(bookingsから自動集計)`);
}