/**
 * 2026年5月の平日（月〜金・祝除く）に各スタッフの available スロットを追加する
 * INSERT IGNORE を使うので再実行しても安全（既存データは上書きしない）
 *
 * 時間帯:
 *   午前: 09:00 〜 12:00
 *   午後: 13:00 〜 17:00
 *
 * 日本の祝日（2026/5）:
 *   5/3(日) 憲法記念日、5/4(月) みどりの日、5/5(火) こどもの日、5/6(水) 振替休日
 */

import { getConnection } from "../db/connection.js";
import type { RowDataPacket } from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const YEAR  = 2026;
const MONTH = 5;

const JP_HOLIDAYS = new Set([
    "2026-05-03",
    "2026-05-04",
    "2026-05-05",
    "2026-05-06",
]);

function getWorkdays(year: number, month: number): string[] {
    const days: string[] = [];
    const last = new Date(year, month, 0).getDate();
    for (let d = 1; d <= last; d++) {
        const date = new Date(year, month - 1, d);
        const dow  = date.getDay(); // 0=Sun, 6=Sat
        if (dow === 0 || dow === 6) continue;
        const key = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        if (JP_HOLIDAYS.has(key)) continue;
        days.push(key);
    }
    return days;
}

async function main() {
    const conn = await getConnection();
    try {
        const [staffRows] = await conn.query<RowDataPacket[]>(
            "SELECT id, name FROM staffs WHERE is_active = true ORDER BY id"
        );
        const workdays = getWorkdays(YEAR, MONTH);

        console.log(`対象スタッフ: ${staffRows.length}人`);
        console.log(`対象平日: ${workdays.length}日`);
        console.log(`  ${workdays.join(", ")}\n`);

        const slots: [number, string, string, string, string][] = [];

        for (const staff of staffRows) {
            for (const date of workdays) {
                // すでに available が存在する日はスキップ
                const [existing] = await conn.query<RowDataPacket[]>(
                    "SELECT id FROM schedules WHERE staff_id = ? AND date = ? AND status = 'available' LIMIT 1",
                    [staff.id, date]
                );
                if (existing.length > 0) continue;

                slots.push([staff.id, date, "09:00:00", "12:00:00", "available"]);
                slots.push([staff.id, date, "13:00:00", "17:00:00", "available"]);
            }
        }

        if (slots.length === 0) {
            console.log("追加するスロットはありません（全スタッフ分が既に存在）");
            return;
        }

        // 1000件ずつまとめて INSERT
        const CHUNK = 1000;
        let inserted = 0;
        for (let i = 0; i < slots.length; i += CHUNK) {
            const chunk = slots.slice(i, i + CHUNK);
            const [result] = await conn.query<any>(
                `INSERT IGNORE INTO schedules (staff_id, date, start_time, end_time, status)
                 VALUES ?`,
                [chunk]
            );
            inserted += result.affectedRows ?? 0;
        }

        console.log(`✅ ${inserted} 件のスロットを追加しました`);
        console.log(`   （スキップ: ${slots.length - inserted} 件は重複）`);
    } finally {
        await conn.end();
    }
}

main().catch((err) => {
    console.error("❌ エラー:", err.message);
    process.exit(1);
});
