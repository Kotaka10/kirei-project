import { Connection } from "mysql2/promise";
import { Holiday } from "../types";

const HOLIDAY_DATA: [string, string, boolean][] =[
    ["2024-01-01", "元日",           false],
    ["2024-01-08", "成人の日",       false],
    ["2024-02-11", "建国記念の日",   false],
    ["2024-02-23", "天皇誕生日",     false],
    ["2024-03-20", "春分の日",       false],
    ["2024-04-29", "昭和の日",       false],
    ["2024-05-03", "憲法記念日",     false],
    ["2024-05-04", "みどりの日",     false],
    ["2024-05-05", "こどもの日",     false],
    ["2024-07-15", "海の日",         false],
    ["2024-08-11", "山の日",         false],
    ["2024-09-16", "敬老の日",       false],
    ["2024-09-22", "秋分の日",       false],
    ["2024-10-14", "スポーツの日",   false],
    ["2024-11-03", "文化の日",       false],
    ["2024-11-23", "勤労感謝の日",   false],
    // 2024年 繁忙期
    ["2024-06-01", "梅雨前エアコン繁忙期", true],
    ["2024-06-15", "梅雨前エアコン繁忙期", true],
    ["2024-07-01", "夏季繁忙期",     true],
    ["2024-07-20", "夏季繁忙期",     true],
    ["2024-08-01", "夏季繁忙期",     true],
    ["2024-08-20", "夏季繁忙期",     true],
    // 2025年 祝日
    ["2025-01-01", "元日",           false],
    ["2025-01-13", "成人の日",       false],
    ["2025-02-11", "建国記念の日",   false],
    ["2025-02-23", "天皇誕生日",     false],
    ["2025-03-20", "春分の日",       false],
    ["2025-04-29", "昭和の日",       false],
    ["2025-05-03", "憲法記念日",     false],
    ["2025-05-04", "みどりの日",     false],
    ["2025-05-05", "こどもの日",     false],
    ["2025-07-21", "海の日",         false],
    ["2025-08-11", "山の日",         false],
    // 2025年 繁忙期
    ["2025-06-01", "梅雨前エアコン繁忙期", true],
    ["2025-07-01", "夏季繁忙期",     true],
    ["2025-08-01", "夏季繁忙期",     true],
]

    export async function generateHolidays(conn: Connection): Promise<void> {
        console.log("祝日・繁忙期データ作成中...");

        await conn.query(
            `INSERT IGNORE INTO holidays (date, name, is_busy)
            VALUES ?`,
            [HOLIDAY_DATA]
        );

        console.log(` ✔︎ holidays: ${HOLIDAY_DATA.length}件挿入`);
    }