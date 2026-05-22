import { Connection, type RowDataPacket } from "mysql2/promise";

export async function generateSales(conn: Connection): Promise<void> {
    console.log("売上データ生成中...");

    const [rows] = await conn.query<RowDataPacket[]>(`
        SELECT
            DATE(scheduled_at)  AS date,
            SUM(price)          AS total_amount,
            COUNT(*)            AS booking_count
        FROM bookings
        WHERE status = 'completed'
        GROUP BY DATE(scheduled_at)
    `);

    if (rows.length === 0) {
        console.log("完了済み予約データがありません。スキップします。");
        return;
    }

    const salesRows = rows.map(r => [r.date, r.total_amount, r.booking_count]);

    await conn.query(
        `INSERT IGNORE INTO sales (date, total_amount, booking_count)
        VALUES ?`,
        [salesRows]
    );

    console.log(` ✔︎ sales: ${rows.length}件挿入`);
}
