import { Connection } from "mysql2/promise";
import {
  getCustomerBookings,
  checkStaffAvailability,
  searchStaff,
  getSchedule,
  getSalesSummary,
  findMatchingStaff,
  analyzeSkillGaps,
  suggestTeam,
  requestStaffAssignment,
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
                result = await getSchedule(
                    conn,
                    args as { date?: string; start_date?: string; end_date?: string; service_type?: string; status?: string },
                    ctx
                );
                break;
            case "get_sales_summary":
                result = await getSalesSummary(conn, args as { period: string; year?: number; month?: number }, ctx);
                break;
            case "find_matching_staff":
                result = await findMatchingStaff(conn, args as { service_type: string; date?: string }, ctx);
                break;
            case "analyze_skill_gaps":
                result = await analyzeSkillGaps(conn, args as { service_type?: string }, ctx);
                break;
            case "suggest_team":
                result = await suggestTeam(conn, args as { service_type: string; date: string; team_size?: number }, ctx);
                break;
            case "request_staff_assignment":
                result = await requestStaffAssignment(
                    conn,
                    args as { date: string; target_staff_name: string; service_type?: string; customer_name?: string; booking_id?: number; note?: string },
                    ctx
                );
                break;
            default:
                result = { error: `未知のツール: ${toolName}`};
        }

        return JSON.stringify(result);
    } catch (err: any) {
        return JSON.stringify({ error: err.message ?? "DBエラー" });
    }
}