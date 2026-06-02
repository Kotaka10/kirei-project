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
  getJobMaterials,
  recordJobMaterials,
  estimateVisitPrice,
  getSalesTalkTips,
  searchKnowhow,
  saveKnowhow,
  markKnowhowHelpful,
  getPurchaseLinks,
  generateEstimateDocument,
  generateWorkReport,
  generateInvoice,
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
                    args as { date?: string; start_date?: string; end_date?: string; service_type?: string; status?: string; staff_name?: string },
                    ctx
                );
                break;
            case "get_sales_summary":
                result = await getSalesSummary(conn, args as { period: string; year?: number; month?: number }, ctx);
                break;
            case "find_matching_staff":
                result = await findMatchingStaff(conn, args as { service_type: string; date?: string; booking_id?: number }, ctx);
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
            case "get_job_materials":
                result = await getJobMaterials(conn, args as { service_type?: string; booking_id?: number }, ctx);
                break;
            case "record_job_materials":
                result = await recordJobMaterials(
                    conn,
                    args as { booking_id: number; materials: { name: string; qty?: number; notes?: string }[] },
                    ctx
                );
                break;
            case "estimate_visit_price":
                result = await estimateVisitPrice(
                    conn,
                    args as {
                        service_type: string;
                        location_type?: string;
                        area_sqm?: number;
                        unit_count?: number;
                        dirty_level?: "normal" | "dirty" | "very_dirty";
                        customer_name?: string;
                        save_estimate?: boolean;
                    },
                    ctx
                );
                break;
            case "get_sales_talk_tips":
                result = await getSalesTalkTips(
                    conn,
                    args as { service_type?: string; situation?: string; talk_phase?: string },
                    ctx
                );
                break;
            case "search_knowhow":
                result = await searchKnowhow(
                    conn,
                    args as { keyword?: string; category?: string; difficulty?: "beginner" | "intermediate" | "advanced"; limit?: number },
                    ctx
                );
                break;
            case "save_knowhow":
                result = await saveKnowhow(
                    conn,
                    args as { title: string; content: string; category?: string; tags?: string; difficulty?: "beginner" | "intermediate" | "advanced" },
                    ctx
                );
                break;
            case "mark_knowhow_helpful":
                result = await markKnowhowHelpful(
                    conn,
                    args as { id: number },
                    ctx
                );
                break;
            case "get_purchase_links":
                result = getPurchaseLinks(
                    conn,
                    args as { material_name: string; quantity?: number },
                    ctx
                );
                break;
            case "generate_estimate_document":
                result = await generateEstimateDocument(
                    conn,
                    args as {
                        customer_name:    string;
                        customer_address?: string;
                        estimate_id?:     number;
                        service_details?: { service_type: string; description: string; amount: number }[];
                        valid_days?:      number;
                        notes?:           string;
                    },
                    ctx
                );
                break;
            case "generate_work_report":
                result = await generateWorkReport(
                    conn,
                    args as {
                        booking_id:       number;
                        work_summary:     string;
                        issues_found?:    string;
                        recommendations?: string;
                        next_visit_date?: string;
                    },
                    ctx
                );
                break;
            case "generate_invoice":
                result = await generateInvoice(
                    conn,
                    args as {
                        customer_name:     string;
                        customer_address?: string;
                        booking_id?:       number;
                        estimate_id?:      number;
                        line_items?:       { description: string; amount: number }[];
                        payment_due_days?: number;
                        bank_info?:        string;
                        notes?:            string;
                    },
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