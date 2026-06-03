import { Connection, type ResultSetHeader } from "mysql2/promise";
import type { UserContext } from "../../types/auth.js";

// =============================================
// 訪問見積もり保存
// =============================================
export async function saveVisitEstimate(
    conn: Connection,
    args: {
        service_type:   string;
        customer_name:  string;
        estimated_min:  number;
        estimated_max:  number;
        location_type?: string;
        area_sqm?:      number;
        unit_count?:    number;
        dirty_level?:   "normal" | "dirty" | "very_dirty";
    },
    ctx: UserContext
): Promise<object> {
    const dirtyLevel = args.dirty_level ?? "normal";

    const [ins] = await conn.execute<ResultSetHeader>(
        `INSERT INTO visit_estimates
         (customer_name, service_type, location_type, area_sqm, unit_count, dirty_level, estimated_min, estimated_max, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            args.customer_name,
            args.service_type,
            args.location_type ?? null,
            args.area_sqm      ?? null,
            args.unit_count    ?? null,
            dirtyLevel,
            args.estimated_min,
            args.estimated_max,
            ctx.staffId,
        ]
    );

    return {
        saved:         true,
        estimate_id:   ins.insertId,
        customer_name: args.customer_name,
        service_type:  args.service_type,
        estimated_min: args.estimated_min,
        estimated_max: args.estimated_max,
        message:       `見積もりをDBに保存しました（ID: ${ins.insertId}）`,
    };
}