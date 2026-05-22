import { Connection, type RowDataPacket } from "mysql2/promise";

export async function generateSchedules(conn: Connection): Promise<void> {
    console.log("スケジュールデータ生成中...");

    const [staffRows] = await conn.query<RowDataPacket[]>(
        "SELECT id FROM staffs WHERE is_active = true"
    );
    const [bookingRows] = await conn.query<RowDataPacket[]>(
        "SELECT id, staff_id, scheduled_at FROM bookings WHERE status != 'cancelled'"
    );

    if (staffRows.length === 0) {
        console.log("スタッフデータがありません。スキップします。");
        return;
    }

    const rows = bookingRows.map(b => {
        const dt = new Date(b.scheduled_at);
        const date = dt.toISOString().split("T")[0];
        const startHour = dt.getHours() || 9;
        const start = `${String(startHour).padStart(2, "0")}:00:00`;
        const end   = `${String(Math.min(startHour + 2, 20)).padStart(2, "0")}:00:00`;
        return [b.staff_id, date, start, end, "booked", b.id];
    });

    if (rows.length === 0) {
        console.log("予約データがありません。スキップします。");
        return;
    }

    await conn.query(
        `INSERT IGNORE INTO schedules (staff_id, date, start_time, end_time, status, booking_id)
        VALUES ?`,
        [rows]
    );

    console.log(` ✔︎ schedules: ${rows.length}件挿入`);
}
