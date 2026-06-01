import { Connection, type RowDataPacket, type ResultSetHeader } from "mysql2/promise";
import type { UserContext } from "../../types/auth.js";

// =============================================
// 訪問見積もり概算
// =============================================
export async function estimateVisitPrice(
    conn: Connection,
    args: {
        service_type:  string;
        location_type?: string;
        area_sqm?:     number;
        unit_count?:   number;
        dirty_level?:  "normal" | "dirty" | "very_dirty";
        customer_name?: string;
        save_estimate?: boolean;
    },
    ctx: UserContext
): Promise<object> {
    const dirtyLevel = args.dirty_level ?? "normal";

    // テンプレート取得（部分一致）
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

    // 汚れ度係数の選択
    const multiplierMap: Record<string, number> = {
        normal:    Number(tmpl.normal_multiplier),
        dirty:     Number(tmpl.dirty_multiplier),
        very_dirty: Number(tmpl.very_dirty_multiplier),
    };
    const multiplier = multiplierMap[dirtyLevel] ?? 1.0;

    // 基本料金
    let baseAmount = Number(tmpl.base_price);

    // 単位あたり追加料金
    let unitAmount = 0;
    let unitBreakdown = "";
    if (tmpl.price_per_unit && tmpl.unit_type) {
        const count = args.unit_count ?? args.area_sqm ?? 1;
        unitAmount = Number(tmpl.price_per_unit) * count;
        unitBreakdown = `${tmpl.price_per_unit.toLocaleString()}円 × ${count}${tmpl.unit_type}`;
    }

    const subtotal   = baseAmount + unitAmount;
    const estimated  = Math.max(subtotal * multiplier, Number(tmpl.min_price ?? 0));
    // 下限・上限（±15%の幅）
    const estimatedMin = Math.ceil(estimated * 0.92 / 100) * 100;
    const estimatedMax = Math.ceil(estimated * 1.15 / 100) * 100;

    // 過去の同種見積もりの参考データ
    const [pastRows] = await conn.query<RowDataPacket[]>(
        `SELECT
            AVG((estimated_min + estimated_max) / 2) AS avg_price,
            COUNT(*) AS count,
            MIN(estimated_min) AS past_min,
            MAX(estimated_max) AS past_max
         FROM visit_estimates
         WHERE service_type LIKE ? AND dirty_level = ?`,
        [`%${args.service_type}%`, dirtyLevel]
    );
    const past = pastRows[0] ?? null;

    // save_estimate=true かつ customer_name があれば保存
    let savedId: number | null = null;
    if (args.save_estimate && args.customer_name) {
        const [ins] = await conn.execute<ResultSetHeader>(
            `INSERT INTO visit_estimates
             (customer_name, service_type, location_type, area_sqm, unit_count, dirty_level, estimated_min, estimated_max, created_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                args.customer_name,
                tmpl.service_type,
                args.location_type ?? null,
                args.area_sqm     ?? null,
                args.unit_count   ?? null,
                dirtyLevel,
                estimatedMin,
                estimatedMax,
                ctx.staffId,
            ]
        );
        savedId = ins.insertId;
    }

    const dirtyLabel: Record<string, string> = {
        normal:     "通常",
        dirty:      "汚れあり",
        very_dirty: "ひどい汚れ",
    };

    return {
        service_type:   tmpl.service_type,
        location_type:  args.location_type ?? null,
        dirty_level:    dirtyLabel[dirtyLevel],
        estimated_min:  estimatedMin,
        estimated_max:  estimatedMax,
        breakdown: {
            base_price:     baseAmount,
            unit_breakdown: unitBreakdown || null,
            dirty_multiplier: `×${multiplier}（${dirtyLabel[dirtyLevel]}）`,
        },
        template_notes: tmpl.notes,
        past_reference: past !== null && Number(past.count) > 0 ? {
            case_count:  Number(past.count),
            avg_price:   Math.round(Number(past.avg_price)),
            past_min:    Number(past.past_min),
            past_max:    Number(past.past_max),
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

// =============================================
// 営業トーク提案
// =============================================
export async function getSalesTalkTips(
    conn: Connection,
    args: {
        service_type?: string;
        situation?:    string;
        talk_phase?:   string;
    },
    _ctx: UserContext
): Promise<object> {
    const conditions: string[] = [];
    const params: any[] = [];

    // サービス種別フィルタ（NULLは全サービス共通）
    if (args.service_type) {
        conditions.push("(service_type LIKE ? OR service_type IS NULL)");
        params.push(`%${args.service_type}%`);
    }

    // 状況フィルタ
    if (args.situation) {
        conditions.push("(situation LIKE ? OR situation = '全般' OR situation IS NULL)");
        params.push(`%${args.situation}%`);
    }

    // フェーズフィルタ
    const validPhases = ["opening", "discovery", "proposal", "closing"];
    if (args.talk_phase && args.talk_phase !== "all" && validPhases.includes(args.talk_phase)) {
        conditions.push("talk_phase = ?");
        params.push(args.talk_phase);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const [rows] = await conn.query<RowDataPacket[]>(
        `SELECT service_type, situation, talk_phase, tip_content, effectiveness_score
         FROM sales_talk_tips
         ${whereClause}
         ORDER BY effectiveness_score DESC, talk_phase, id`,
        params
    );

    if (rows.length === 0) {
        // フォールバック: 共通ティップスを返す
        const [fallback] = await conn.query<RowDataPacket[]>(
            `SELECT service_type, situation, talk_phase, tip_content, effectiveness_score
             FROM sales_talk_tips
             WHERE service_type IS NULL
             ORDER BY effectiveness_score DESC, talk_phase`
        );
        if (fallback.length === 0) return { message: "営業トークティップスが見つかりませんでした" };
        return formatTips(fallback, args);
    }

    return formatTips(rows, args);
}

function formatTips(rows: RowDataPacket[], args: { service_type?: string; situation?: string; talk_phase?: string }): object {
    const phaseLabel: Record<string, string> = {
        opening:   "① アイスブレイク・冒頭",
        discovery: "② ヒアリング・課題発見",
        proposal:  "③ 提案・価値訴求",
        closing:   "④ クロージング",
    };

    const grouped: Record<string, { content: string; score: number }[]> = {};
    for (const row of rows) {
        const phase = row.talk_phase as string;
        if (!grouped[phase]) grouped[phase] = [];
        grouped[phase]!.push({ content: row.tip_content, score: row.effectiveness_score });
    }

    const phases = ["opening", "discovery", "proposal", "closing"];
    const result: Record<string, any> = {
        service_type: args.service_type ?? "全サービス共通",
        situation:    args.situation    ?? "全般",
        total_tips:   rows.length,
        talk_script:  {},
    };

    for (const phase of phases) {
        if (grouped[phase] && grouped[phase]!.length > 0) {
            result.talk_script[phaseLabel[phase]!] = grouped[phase]!.map(t => t.content);
        }
    }

    result.note = "★マーク（効果スコア5）のトークを優先して使用してください。お客様の反応に合わせてアレンジしてください。";
    return result;
}