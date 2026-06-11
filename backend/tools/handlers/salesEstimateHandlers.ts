import { Connection, type RowDataPacket, type ResultSetHeader } from "mysql2/promise";
import type { UserContext } from "../../types/auth.js";

type DirtyLevel = "normal" | "dirty" | "very_dirty";

export async function estimateVisitPrice(
    conn: Connection,
    args: {
        service_type:  string;
        location_type?: string;
        area_sqm?:     number;
        unit_count?:   number;
        dirty_level?:  DirtyLevel;
        customer_name?: string;
        save_estimate?: boolean;
    },
    ctx: UserContext
): Promise<object> {
    const dirtyLevel = args.dirty_level ?? "normal";
    const [tmplRows] = await conn.query<RowDataPacket[]>(
        `SELECT * FROM estimate_templates WHERE service_type LIKE ? LIMIT 1`,
        [`%${args.service_type}%`]
    );

    if (tmplRows.length === 0) {
        return {
            error: `「${args.service_type}」の料金テンプレートが見つかりません。別のサービス種別名で試してください。`,
            available_services: await getAvailableServices(conn),
        };
    }

    const tmpl = tmplRows[0]!;
    const dirtyLabel: Record<DirtyLevel, string> = {
        normal:     "通常",
        dirty:      "汚れあり",
        very_dirty: "ひどい汚れ",
    };
    const multiplierMap: Record<DirtyLevel, number> = {
        normal:      Number(tmpl.normal_multiplier),
        dirty:       Number(tmpl.dirty_multiplier),
        very_dirty:  Number(tmpl.very_dirty_multiplier),
    };
    const multiplier = multiplierMap[dirtyLevel] ?? 1.0;
    const baseAmount = Number(tmpl.base_price);
    const quantity = tmpl.price_per_unit && tmpl.unit_type ? args.unit_count ?? args.area_sqm ?? 1 : null;
    const unitAmount = quantity !== null ? Number(tmpl.price_per_unit) * quantity : 0;
    const unitBreakdown = quantity !== null ? `${Number(tmpl.price_per_unit).toLocaleString()}円 × ${quantity}${tmpl.unit_type}` : "";
    const subtotal = baseAmount + unitAmount;
    const adjustmentAmount = Math.round(subtotal * multiplier) - subtotal;
    const estimated = Math.max(subtotal * multiplier, Number(tmpl.min_price ?? 0));
    const estimatedMin = Math.ceil(estimated * 0.92 / 100) * 100;
    const estimatedMax = Math.ceil(estimated * 1.15 / 100) * 100;

    const [pastRows] = await conn.query<RowDataPacket[]>(
        `SELECT AVG((estimated_min + estimated_max) / 2) AS avg_price,
                COUNT(*) AS count,
                MIN(estimated_min) AS past_min,
                MAX(estimated_max) AS past_max
         FROM visit_estimates
         WHERE service_type LIKE ? AND dirty_level = ?`,
        [`%${args.service_type}%`, dirtyLevel]
    );
    const past = pastRows[0] ?? null;
    const savedId = await maybeSaveEstimate(conn, args, tmpl.service_type as string, dirtyLevel, estimatedMin, estimatedMax, ctx);

    return {
        service_type:   tmpl.service_type,
        location_type:  args.location_type ?? null,
        dirty_level:    dirtyLabel[dirtyLevel],
        estimated_min:  estimatedMin,
        estimated_max:  estimatedMax,
        breakdown: buildEstimateBreakdown({
            baseAmount,
            unitAmount,
            unitPrice: tmpl.price_per_unit ? Number(tmpl.price_per_unit) : null,
            quantity,
            unitType: tmpl.unit_type ?? null,
            unitBreakdown,
            subtotal,
            multiplier,
            dirtyLabel: dirtyLabel[dirtyLevel],
            adjustmentAmount,
            estimated,
            estimatedMin,
            estimatedMax,
        }),
        template_notes: tmpl.notes,
        past_reference: past !== null && Number(past.count) > 0 ? {
            case_count: Number(past.count),
            avg_price:  Math.round(Number(past.avg_price)),
            past_min:   Number(past.past_min),
            past_max:   Number(past.past_max),
        } : null,
        saved_estimate_id: savedId,
        note: "概算金額です。現場確認後に正式見積もりをお出しします。",
    };
}

export async function getAvailableServices(conn: Connection): Promise<string[]> {
    const [rows] = await conn.query<RowDataPacket[]>(
        `SELECT service_type FROM estimate_templates ORDER BY id`
    );
    return rows.map(r => r.service_type as string);
}

async function maybeSaveEstimate(
    conn: Connection,
    args: Parameters<typeof estimateVisitPrice>[1],
    serviceType: string,
    dirtyLevel: string,
    estimatedMin: number,
    estimatedMax: number,
    ctx: UserContext,
): Promise<number | null> {
    if (!args.save_estimate || !args.customer_name) return null;

    const [ins] = await conn.execute<ResultSetHeader>(
        `INSERT INTO visit_estimates
         (customer_name, service_type, location_type, area_sqm, unit_count, dirty_level, estimated_min, estimated_max, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            args.customer_name,
            serviceType,
            args.location_type ?? null,
            args.area_sqm     ?? null,
            args.unit_count   ?? null,
            dirtyLevel,
            estimatedMin,
            estimatedMax,
            ctx.staffId,
        ]
    );
    return ins.insertId;
}

function buildEstimateBreakdown(params: {
    baseAmount: number;
    unitAmount: number;
    unitPrice: number | null;
    quantity: number | null;
    unitType: string | null;
    unitBreakdown: string;
    subtotal: number;
    multiplier: number;
    dirtyLabel: string;
    adjustmentAmount: number;
    estimated: number;
    estimatedMin: number;
    estimatedMax: number;
}) {
    return {
        items: [
            { label: "基本料金", amount: params.baseAmount },
            ...(params.unitAmount > 0 ? [{
                label:       `${params.unitType ?? "数量"}加算`,
                amount:      params.unitAmount,
                unit_price:  params.unitPrice,
                quantity:    params.quantity,
                unit:        params.unitType,
                calculation: params.unitBreakdown,
            }] : []),
            ...(params.adjustmentAmount !== 0 ? [{
                label:       `汚れ度調整（${params.dirtyLabel}）`,
                amount:      params.adjustmentAmount,
                calculation: `${params.subtotal.toLocaleString()}円 × ${params.multiplier}`,
            }] : []),
        ],
        base_price: params.baseAmount,
        unit_price: params.unitPrice,
        quantity: params.quantity,
        unit_type: params.unitType,
        unit_breakdown: params.unitBreakdown || null,
        subtotal: params.subtotal,
        dirty_multiplier: `×${params.multiplier}（${params.dirtyLabel}）`,
        estimated_before_range: Math.round(params.estimated),
        estimated_range: { min: params.estimatedMin, max: params.estimatedMax },
        tax_included_range: {
            min: Math.round(params.estimatedMin * 1.1),
            max: Math.round(params.estimatedMax * 1.1),
        },
    };
}
