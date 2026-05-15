import { Connection } from "mysql2/promise";
import {
  getCustomerBookings,
  checkStaffAvailability,
  getSchedule,
  getSalesSummary,
} from "./handlers";

export async function dispatchTool(
    conn: Connection,
    toolName:  string,
    args: Record<string, any>
): Promise<string> {
    try {
        let result: object;

        switch (toolName) {
            case "get_customer_bookings":
                result = await getCustomerBookings(conn, args);
                break;
            case "check_staff_availability":
                result = await checkStaffAvailability(conn, args as { date: string; staff_name?: string });
                break;
            case "get_schedule":
                result = await getSchedule(conn, args);
                break;
            case "get_sales_summary":
                result = await getSalesSummary(conn, args as { period: string; year?: number; month?: number });
                break;
            default:
                result = { error: `未知のツール: ${toolName}`};
        }

        return JSON.stringify(result);
    } catch (err: any) {
        return JSON.stringify({ error: err.message ?? "DBエラー" });
    }
}