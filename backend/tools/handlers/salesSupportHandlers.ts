import { Connection, type RowDataPacket } from "mysql2/promise";
import type { UserContext } from "../../types/auth.js";

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
    _ctx: UserContext // アンダーバー：この引数を受け取るけど、この関数内では使わないという意思表示
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
