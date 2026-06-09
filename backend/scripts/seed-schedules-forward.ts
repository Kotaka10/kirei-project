/**
 * 指定期間の平日（月〜金・祝除く）に、各アクティブスタッフの available スロットを補充する。
 * seed-monthly-schedules.ts（2026年5月固定）の続きで、6月以降の空き枠が無く
 * 「案件に適したスタッフが全員空いていない」と表示される問題を解消するためのもの。
 *
 * 時間帯（既存シードと同一）:
 *   午前: 09:00 〜 12:00
 *   午後: 13:00 〜 17:00
 *
 * 既に available スロットがある (staff_id, date) はスキップするので再実行しても安全。
 * booked 行とは併存させる（その日に空き枠があれば「対応可能」とみなす既存仕様に合わせる）。
 *
 * 日本の祝日（対象期間 2026/6〜8）:
 *   7/20(月) 海の日、8/11(火) 山の日  ※6月は祝日なし
 */
import { getConnection } from "../db/connection.js";
import type { RowDataPacket } from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

// 5月末まではデータ済みのため、6月頭から夏の予約ホライズン（〜8月末）までを補充
const START_DATE = "2026-06-01";
const END_DATE   = "2026-08-31";

const JP_HOLIDAYS = new Set([
    "2026-07-20", // 海の日
    "2026-08-11", // 山の日
]);

/** start〜end（両端含む）の平日キー(YYYY-MM-DD)を返す。祝日・土日は除外 */
function getWorkdaysInRange(start: string, end: string): string[] {
    const [sy, sm, sd] = start.split("-").map(Number) as [number, number, number];
    const [ey, em, ed] = end.split("-").map(Number) as [number, number, number];
    const cursor = new Date(sy, sm - 1, sd);
    const last   = new Date(ey, em - 1, ed);
    const days: string[] = [];

    while (cursor <= last) {
        const dow = cursor.getDay(); // 0=Sun, 6=Sat
        const key =
            `${cursor.getFullYear()}-` +
            `${String(cursor.getMonth() + 1).padStart(2, "0")}-` +
            `${String(cursor.getDate()).padStart(2, "0")}`;
        if (dow !== 0 && dow !== 6 && !JP_HOLIDAYS.has(key)) {
            days.push(key);
        }
        cursor.setDate(cursor.getDate() + 1);
    }
    return days;
}

async function main() {
    const conn = await getConnection();
    try {
        const [staffRows] = await conn.query<RowDataPacket[]>(
            "SELECT id, name FROM staffs WHERE is_active = true ORDER BY id"
        );
        const workdays = getWorkdaysInRange(START_DATE, END_DATE);

        console.log(`対象スタッフ: ${staffRows.length}人`);
        console.log(`対象平日: ${workdays.length}日 (${START_DATE} 〜 ${END_DATE})\n`);

        // 既に available スロットを持つ (staff_id|date) を一括取得してスキップ判定に使う
        const [existingRows] = await conn.query<RowDataPacket[]>(
            `SELECT DISTINCT staff_id, date FROM schedules
             WHERE status = 'available' AND date BETWEEN ? AND ?`,
            [START_DATE, END_DATE]
        );
        const existing = new Set<string>(
            existingRows.map(r => `${r.staff_id}|${new Date(r.date).toISOString().slice(0, 10)}`)
        );

        const slots: [number, string, string, string, string][] = [];
        for (const staff of staffRows) {
            for (const date of workdays) {
                if (existing.has(`${staff.id}|${date}`)) continue;
                slots.push([staff.id, date, "09:00:00", "12:00:00", "available"]);
                slots.push([staff.id, date, "13:00:00", "17:00:00", "available"]);
            }
        }

        if (slots.length === 0) {
            console.log("追加するスロットはありません（対象期間は全スタッフ分が既に存在）");
            return;
        }

        const CHUNK = 1000;
        let inserted = 0;
        for (let i = 0; i < slots.length; i += CHUNK) {
            const chunk = slots.slice(i, i + CHUNK);
            const [result] = await conn.query<any>(
                `INSERT INTO schedules (staff_id, date, start_time, end_time, status)
                 VALUES ?`,
                [chunk]
            );
            inserted += result.affectedRows ?? 0;
        }

        console.log(`✅ ${inserted} 件の available スロットを追加しました`);

        // 確認: 本日の available スタッフ数
        const [todayAvail] = await conn.query<RowDataPacket[]>(
            "SELECT COUNT(DISTINCT staff_id) AS n FROM schedules WHERE date = CURDATE() AND status = 'available'"
        );
        console.log(`📊 本日(CURDATE)の available スタッフ数: ${todayAvail[0]?.n ?? 0} 名`);
    } finally {
        await conn.end();
    }
}

main().catch((err) => {
    console.error("❌ エラー:", err.message);
    process.exit(1);
});
