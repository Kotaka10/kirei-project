import { generateCustomers } from "./generators/customers.js";
import { getConnection } from "../db/connection.js";
import { generateStaff } from "./generators/staff.js";
import { generateHolidays } from "./generators/holidays.js";
import { generateBookings } from "./generators/bookings.js";
import { generateSchedules } from "./generators/schedules.js";
import { generateSales } from "./generators/sales.js";

async function main () {
    const conn = await getConnection();
    console.log("DB接続完了\n");

    try {
        await generateCustomers(conn, 30);
        await generateStaff(conn, 10);
        await generateHolidays(conn);
        await generateBookings(conn, 120);
        await generateSchedules(conn);
        await generateSales(conn);

        console.log("\n全テーブルのダミーデータを生成完了");
    } catch (err) {
        console.error("エラー:", err);
        process.exit(1);
    } finally {
        await conn.end();
    }
}

main().catch(console.error);