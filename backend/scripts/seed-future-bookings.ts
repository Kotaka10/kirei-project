/**
 * 2026/5/27〜7/31 の予約・スケジュールをまとめて登録する
 *
 * 件数:
 *   5月 (5/27-5/31) :  5件 (1日1件)
 *   6月 (6/1-6/30)  : 50件
 *   7月 (7/1-7/31)  : 50件
 *   計              : 105件
 *
 * 実行: npx tsx scripts/seed-future-bookings.ts
 */

import { getConnection } from "../db/connection.js";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

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

const START_TIMES = ["09:00", "10:00", "11:00", "13:00", "14:00", "15:00"];

const PRICES = [18000, 15000, 20000, 16000, 25000, 22000, 19000, 28000, 17000, 23000];

const STAFF_IDS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

/** 指定月の全日付を返す（startDay 以降） */
function getDatesForMonth(year: number, month: number, startDay = 1): string[] {
    const daysInMonth = new Date(year, month, 0).getDate();
    const dates: string[] = [];
    for (let d = startDay; d <= daysInMonth; d++) {
        dates.push(
            `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`
        );
    }
    return dates;
}

/**
 * dates を count 件になるように繰り返し配布し、日付順に並べて返す。
 * 同じ日に複数件割り当てられる場合、slot が 0, 1, 2... と増える。
 */
function distributeBookings(
    dates: string[],
    count: number
): Array<{ date: string; slot: number }> {
    const result: Array<{ date: string; slot: number }> = [];
    const n = dates.length;
    for (let i = 0; i < count; i++) {
        result.push({ date: dates[i % n]!, slot: Math.floor(i / n) });
    }
    return result.sort((a, b) => a.date.localeCompare(b.date) || a.slot - b.slot);
}

async function main() {
    const conn = await getConnection();
    try {
        const [customers] = await conn.query<RowDataPacket[]>(
            "SELECT id FROM customers ORDER BY id LIMIT 30"
        );
        if (customers.length === 0) throw new Error("顧客データが存在しません");

        const [staffRows] = await conn.query<RowDataPacket[]>(
            "SELECT id FROM staffs WHERE is_active = true ORDER BY id"
        );
        const activeStaffIds = staffRows.length > 0
            ? staffRows.map((r) => r.id as number)
            : STAFF_IDS;

        // 各月の予約スロットを生成
        const maySlots  = distributeBookings(getDatesForMonth(2026, 5, 27),  5);
        const juneSlots = distributeBookings(getDatesForMonth(2026, 6),      50);
        const julySlots = distributeBookings(getDatesForMonth(2026, 7),      50);

        const allSlots = [...maySlots, ...juneSlots, ...julySlots];

        let bookingCount  = 0;
        let scheduleCount = 0;

        for (const [i, { date, slot }] of allSlots.entries()) {
            const staffId     = activeStaffIds[i % activeStaffIds.length]!;
            const serviceType = SERVICE_TYPES[i % SERVICE_TYPES.length]!;
            const price       = PRICES[i % PRICES.length]!;
            const customerId  = customers[i % customers.length]!.id;

            // slot 0 は午前系、slot 1 は午後系の時刻を優先して使う
            const timeOffset  = slot * 3;
            const startTime   = START_TIMES[(i + timeOffset) % START_TIMES.length]!;
            const [sh, sm]    = startTime.split(":");
            const endHour     = String(parseInt(sh!) + 2).padStart(2, "0");
            const endTime     = `${endHour}:${sm}`;
            const scheduledAt = `${date} ${startTime}:00`;

            // bookings INSERT
            const [bookingResult] = await conn.query<ResultSetHeader>(
                `INSERT INTO bookings (customer_id, staff_id, service_type, scheduled_at, status, price)
                 VALUES (?, ?, ?, ?, 'scheduled', ?)`,
                [customerId, staffId, serviceType, scheduledAt, price]
            );
            const bookingId = bookingResult.insertId;
            bookingCount++;

            // schedules INSERT IGNORE（既存スロットとの衝突を回避）
            await conn.query(
                `INSERT IGNORE INTO schedules (staff_id, date, start_time, end_time, status, booking_id)
                 VALUES (?, ?, ?, ?, 'booked', ?)`,
                [staffId, date, `${startTime}:00`, `${endTime}:00`, bookingId]
            );
            scheduleCount++;

            console.log(
                `  [${date}] slot:${slot} staff_id:${staffId}  ${startTime}〜${endTime}` +
                `  ${serviceType}  ¥${price.toLocaleString()}  顧客ID:${customerId}`
            );
        }

        console.log(`\n✅ 予約 ${bookingCount} 件 / スケジュール ${scheduleCount} 件 を登録しました`);
        console.log(`   5月: ${maySlots.length} 件 / 6月: ${juneSlots.length} 件 / 7月: ${julySlots.length} 件`);
    } finally {
        await conn.end();
    }
}

main().catch((err) => {
    console.error("❌ エラー:", err.message);
    process.exit(1);
});
