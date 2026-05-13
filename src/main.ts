import { generateCustomers } from "./generators/customers";
import { getConnection } from "./db/connection";
import { generateStaffs } from "./generators/staffs";
import { generateHolidays } from "./generators/holidays";
import { generateBookings } from "./generators/bookings";
import { generateSchedules } from "./generators/schedules";
import { generateSales } from "./generators/sales";

async function main () {
    const conn = await getConnection();
    console.log("DB接続完了\n");

    try {
        await generateCustomers(conn, 30);
        await generateStaffs(conn);
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