import { Connection, type RowDataPacket } from "mysql2/promise";
import { generateJSON } from "../db/openai.js";
import type { Booking } from "../types/indexTypes.js";

export async function generateBookings(conn: Connection, count = 120): Promise<void> {
    console.log("予約データ生成中...");

    const [customerRows] = await conn.query<RowDataPacket[]>("SELECT id FROM customers LIMIT 50");
    const [staffRows] = await conn.query<RowDataPacket[]>("SELECT id FROM staffs LIMIT 20");

    if (customerRows.length === 0 || staffRows.length === 0) {
        console.log("顧客またはスタッフデータがありません。スキップします。");
        return;
    }

    const customerIds = customerRows.map(r => r.id);
    const staffIds = staffRows.map(r => r.id);

    const data = await generateJSON<{ bookings: Booking[] }>(
        `清掃サービスの予約データを${count}件生成してください。
        各データ:
        - customer_id: ${JSON.stringify(customerIds)}から選択
        - staff_id: ${JSON.stringify(staffIds)}から選択
        - service_type: "エアコン清掃" | "ハウスクリーニング" | "オフィス清掃" | "窓清掃" | "換気扇清掃"
        - scheduled_at: 2024-01-01から2026-12-31の範囲でISO形式（YYYY-MM-DD HH:MM:SS）
        - status: "completed" | "scheduled" | "cancelled"
        - price: 5000から50000の整数（1000単位）`,
        `ダミーデータ生成の専門家です。{"bookings":[...]}の形式のJSONのみ返してください。`
    );

    const rows = data.bookings.map(b => [
        b.customer_id,
        b.staff_id,
        b.service_type,
        b.scheduled_at,
        b.status,
        b.price,
    ]);

    await conn.query(
        `INSERT IGNORE INTO bookings (customer_id, staff_id, service_type, scheduled_at, status, price)
        VALUES ?`,
        [rows]
    );

    console.log(` ✔︎ bookings: ${rows.length}件挿入`);
}
