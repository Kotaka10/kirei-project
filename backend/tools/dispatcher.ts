import { Connection } from "mysql2/promise";
import {
  getCustomerBookings,
  checkStaffAvailability,
  searchStaff,
  getSchedule,
  getSalesSummary,
} from "./handlers.js";
import type { UserContext } from "../types/auth.js";

export async function dispatchTool(
    conn:     Connection,
    toolName: string,
    args:     Record<string, any>,
    ctx:      UserContext
): Promise<string> {
    try {
        let result: object;

        switch (toolName) {
            case "get_customer_bookings":
                result = await getCustomerBookings(conn, args, ctx);
                break;
            case "check_staff_availability":
                result = await checkStaffAvailability(conn, args as { date: string; staff_name?: string }, ctx);
                break;
            case "search_staff":
                result = await searchStaff(conn, args as { name?: string; role?: string }, ctx);
                break;
            case "get_schedule":
                result = await getSchedule(conn, args, ctx);
                break;
            case "get_sales_summary":
                result = await getSalesSummary(conn, args as { period: string; year?: number; month?: number }, ctx);
                break;
            default:
                result = { error: `未知のツール: ${toolName}`};
        }

        return JSON.stringify(result);
    } catch (err: any) {
        return JSON.stringify({ error: err.message ?? "DBエラー" });
    }
}