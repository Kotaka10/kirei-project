import { Connection, RowDataPacket } from "mysql2/promise";
import { Booking } from "../types";

const SERVICE_TYPES = [
  "エアコン清掃", "エアコン清掃", "エアコン清掃", // 頻度高め
  "キッチン清掃", "キッチン清掃",
  "浴室清掃",
  "トイレ清掃",
  "レンジフード清掃",
  "洗濯機清掃",
  "換気扇清掃",
  "窓ガラス清掃",
  "定期清掃",
];

const STATUSES: Booking["status"][] = [
    "completed", "completed", "completed",
    "scheduled",
    "cancelled",
];

const randomItem = <T>(arr: T[]): T => {
    return arr[Math.floor(Math.random() * arr.length)];
}

const offsetDate = (days: number): Date => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    d.setHours(9 + Math.floor(Math.random() * 8), 0, 0, 0);

    return d;
}

const toMySQLDatetime = (d: Date): string => {
    return d.toISOString().slice(0, 19).replace("T", " ");
}

export const generateBookings = async (conn: Connection, count = 120): Promise<void> => {
    console.log("予約履歴データ生成中...");

    const [customerRows] = await conn.query<RowDataPacket[]>(
        "SELECT id FROM customers ORDER BY RAND() LIMIT 30"
    );

    const [staffRows] = await conn.query<RowDataPacket[]>(
        "SELECT id FROM staffs WHERE is_active = true"
    );

    const customerIds = customerRows.map((r) => r.id as number);
    const staffIds = staffRows.map((r) => r.id as number);

    const rows: any[][] = [];

    for (let i = 0; i < count; i++) {
        const daysOffset = Math.floor(Math.random() * 455) - 365;
        const dt = offsetDate(daysOffset);

        const status: Booking["status"] = daysOffset > 0 ? "scheduled" : randomItem(STATUSES);

        const price = (Math.floor(Math.random() * 8) + 1) * 3000;

        rows.push([
            randomItem(customerIds),
            randomItem(staffIds),
            randomItem(SERVICE_TYPES),
            toMySQLDatetime(dt),
            status,
            price,
        ]);
    }

    await conn.query(
        `INSERT INTO bookings
        (customer_id, staff_id, service_type, scheduled_at, status, price)
        VALUES ?`,
        [rows]
    );

    console.log(` ✔︎bookings: ${rows.length}件挿入`);
}