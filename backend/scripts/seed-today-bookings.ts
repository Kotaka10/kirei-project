/**
 * 今日(2026-05-22)・明日(2026-05-23) の予約を
 * staff_id 1〜9 のスタッフに1件ずつ登録する
 *
 * bookings に INSERT → 生成した booking_id を schedules に紐付け
 */

import { getConnection } from "../db/connection.js";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const DATES      = ["2026-05-22", "2026-05-23"];
const STAFF_IDS  = [1, 2, 3, 4, 5, 6, 7, 8, 9];

const SERVICE_TYPES = [
    "エアコン清掃",
    "キッチン清掃",
    "浴室清掃",
    "窓清掃",
    "定期清掃",
    "床清掃",
    "換気扇清掃",
    "レンジフード清掃",
    "洗面所清掃",
];

const PRICES = [18000, 15000, 20000, 16000, 25000, 22000, 19000, 28000, 17000];

// 各スタッフの開始時刻（JST）
const START_TIMES: Record<number, string> = {
    1: "09:00", 2: "10:00", 3: "11:00",
    4: "13:00", 5: "14:00", 6: "15:00",
    7: "16:00", 8: "09:30", 9: "10:30",
};

async function main() {
    const conn = await getConnection();
    try {
        // 顧客IDを取得
        const [customers] = await conn.query<RowDataPacket[]>(
            "SELECT id FROM customers ORDER BY id LIMIT 20"
        );
        if (customers.length === 0) throw new Error("顧客データが存在しません");

        let bookingCount  = 0;
        let scheduleCount = 0;

        for (const [dayIdx, date] of DATES.entries()) {
            for (const [staffIdx, staffId] of STAFF_IDS.entries()) {
                const customerId  = customers[(dayIdx * STAFF_IDS.length + staffIdx) % customers.length]!.id;
                const serviceType = SERVICE_TYPES[staffIdx % SERVICE_TYPES.length]!;
                const price       = PRICES[staffIdx % PRICES.length]!;
                const startTime   = START_TIMES[staffId] ?? "09:00";
                const [sh, sm]    = startTime.split(":");
                const endHour     = String(parseInt(sh!) + 2).padStart(2, "0");
                const endTime     = `${endHour}:${sm}`;

                // bookings INSERT
                const scheduledAt = `${date} ${startTime}:00`;
                const [bookingResult] = await conn.query<ResultSetHeader>(
                    `INSERT INTO bookings (customer_id, staff_id, service_type, scheduled_at, status, price)
                     VALUES (?, ?, ?, ?, 'scheduled', ?)`,
                    [customerId, staffId, serviceType, scheduledAt, price]
                );
                const bookingId = bookingResult.insertId;
                bookingCount++;

                // schedules INSERT (booked)
                await conn.query(
                    `INSERT INTO schedules (staff_id, date, start_time, end_time, status, booking_id)
                     VALUES (?, ?, ?, ?, 'booked', ?)`,
                    [staffId, date, `${startTime}:00`, `${endTime}:00`, bookingId]
                );
                scheduleCount++;

                console.log(`  [${date}] staff_id:${staffId} ${startTime}〜${endTime}  ${serviceType}  ¥${price.toLocaleString()}  顧客ID:${customerId}`);
            }
        }

        console.log(`\n✅ 予約 ${bookingCount} 件 / スケジュール ${scheduleCount} 件 を登録しました`);
    } finally {
        await conn.end();
    }
}

main().catch((err) => {
    console.error("❌ エラー:", err.message);
    process.exit(1);
});
