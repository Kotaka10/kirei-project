/**
 * 追加スタッフ30名にスキル・熟練度を割り振る（seed-skills.ts の続き）
 *
 *   熟練度: 1=見習い 2=初級 3=中級 4=上級 5=エキスパート
 *
 *   案件レベル(1〜5)との ±1 帯マッチングが機能するよう、各スタッフの
 *   代表レベル（保有スキルの最高値）が Lv2〜Lv5 に分散するよう設計している。
 *   skills マスタは seed-skills.ts で投入済みである前提（名前で紐付け）。
 *
 *   対象: スキル未登録だったアクティブスタッフ id 11〜43 の30名
 *         （清掃員14・技術者10・監督者6）
 */
import { getConnection } from "../db/connection.js";
import type { RowDataPacket } from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

// ── スタッフスキル割り当て（role に応じた現実的な熟練度）──────────
const STAFF_SKILL_ASSIGNMENTS: { staff_id: number; skill_name: string; level: number }[] = [
    // ── cleaner（清掃員）14名 ─────────────────────────────
    // id:11 代表Lv3
    { staff_id: 11, skill_name: "キッチン清掃", level: 3 },
    { staff_id: 11, skill_name: "浴室清掃",     level: 2 },
    { staff_id: 11, skill_name: "顧客対応",     level: 2 },
    // id:14 代表Lv2
    { staff_id: 14, skill_name: "窓清掃",       level: 2 },
    { staff_id: 14, skill_name: "床清掃",       level: 1 },
    { staff_id: 14, skill_name: "洗面所清掃",   level: 1 },
    // id:15 代表Lv4
    { staff_id: 15, skill_name: "キッチン清掃", level: 4 },
    { staff_id: 15, skill_name: "浴室清掃",     level: 3 },
    { staff_id: 15, skill_name: "窓清掃",       level: 2 },
    { staff_id: 15, skill_name: "顧客対応",     level: 2 },
    // id:17 代表Lv3
    { staff_id: 17, skill_name: "床清掃",       level: 3 },
    { staff_id: 17, skill_name: "窓清掃",       level: 2 },
    { staff_id: 17, skill_name: "定期清掃",     level: 2 },
    // id:21 代表Lv2
    { staff_id: 21, skill_name: "洗面所清掃",   level: 2 },
    { staff_id: 21, skill_name: "キッチン清掃", level: 1 },
    { staff_id: 21, skill_name: "顧客対応",     level: 1 },
    // id:22 代表Lv5
    { staff_id: 22, skill_name: "浴室清掃",     level: 5 },
    { staff_id: 22, skill_name: "キッチン清掃", level: 4 },
    { staff_id: 22, skill_name: "洗面所清掃",   level: 4 },
    { staff_id: 22, skill_name: "顧客対応",     level: 3 },
    // id:24 代表Lv3
    { staff_id: 24, skill_name: "窓清掃",       level: 3 },
    { staff_id: 24, skill_name: "床清掃",       level: 2 },
    { staff_id: 24, skill_name: "顧客対応",     level: 2 },
    // id:27 代表Lv4
    { staff_id: 27, skill_name: "床清掃",       level: 4 },
    { staff_id: 27, skill_name: "定期清掃",     level: 3 },
    { staff_id: 27, skill_name: "窓清掃",       level: 2 },
    // id:31 代表Lv2
    { staff_id: 31, skill_name: "キッチン清掃", level: 2 },
    { staff_id: 31, skill_name: "浴室清掃",     level: 1 },
    // id:33 代表Lv3
    { staff_id: 33, skill_name: "浴室清掃",     level: 3 },
    { staff_id: 33, skill_name: "洗面所清掃",   level: 2 },
    { staff_id: 33, skill_name: "顧客対応",     level: 2 },
    // id:35 代表Lv5
    { staff_id: 35, skill_name: "キッチン清掃", level: 5 },
    { staff_id: 35, skill_name: "浴室清掃",     level: 4 },
    { staff_id: 35, skill_name: "顧客対応",     level: 4 },
    { staff_id: 35, skill_name: "窓清掃",       level: 3 },
    // id:37 代表Lv4
    { staff_id: 37, skill_name: "定期清掃",     level: 4 },
    { staff_id: 37, skill_name: "床清掃",       level: 3 },
    { staff_id: 37, skill_name: "窓清掃",       level: 3 },
    { staff_id: 37, skill_name: "顧客対応",     level: 2 },
    // id:41 代表Lv2
    { staff_id: 41, skill_name: "窓清掃",       level: 2 },
    { staff_id: 41, skill_name: "床清掃",       level: 1 },
    // id:42 代表Lv3
    { staff_id: 42, skill_name: "エアコン清掃", level: 3 },
    { staff_id: 42, skill_name: "キッチン清掃", level: 2 },
    { staff_id: 42, skill_name: "顧客対応",     level: 2 },

    // ── technician（技術者）10名 ─────────────────────────
    // id:12 代表Lv3
    { staff_id: 12, skill_name: "換気扇清掃",   level: 3 },
    { staff_id: 12, skill_name: "機械操作",     level: 2 },
    { staff_id: 12, skill_name: "エアコン清掃", level: 2 },
    // id:16 代表Lv4
    { staff_id: 16, skill_name: "レンジフード清掃", level: 4 },
    { staff_id: 16, skill_name: "換気扇清掃",   level: 3 },
    { staff_id: 16, skill_name: "機械操作",     level: 3 },
    // id:19 代表Lv2
    { staff_id: 19, skill_name: "機械操作",     level: 2 },
    { staff_id: 19, skill_name: "換気扇清掃",   level: 1 },
    // id:23 代表Lv5
    { staff_id: 23, skill_name: "エアコン清掃", level: 5 },
    { staff_id: 23, skill_name: "換気扇清掃",   level: 4 },
    { staff_id: 23, skill_name: "レンジフード清掃", level: 4 },
    { staff_id: 23, skill_name: "機械操作",     level: 4 },
    // id:26 代表Lv3
    { staff_id: 26, skill_name: "機械操作",     level: 3 },
    { staff_id: 26, skill_name: "換気扇清掃",   level: 2 },
    { staff_id: 26, skill_name: "高所作業",     level: 2 },
    // id:30 代表Lv4
    { staff_id: 30, skill_name: "換気扇清掃",   level: 4 },
    { staff_id: 30, skill_name: "レンジフード清掃", level: 3 },
    { staff_id: 30, skill_name: "機械操作",     level: 3 },
    { staff_id: 30, skill_name: "高所作業",     level: 2 },
    // id:32 代表Lv2
    { staff_id: 32, skill_name: "換気扇清掃",   level: 2 },
    { staff_id: 32, skill_name: "機械操作",     level: 1 },
    // id:36 代表Lv4
    { staff_id: 36, skill_name: "機械操作",     level: 4 },
    { staff_id: 36, skill_name: "エアコン清掃", level: 3 },
    { staff_id: 36, skill_name: "高所作業",     level: 3 },
    // id:39 代表Lv3
    { staff_id: 39, skill_name: "レンジフード清掃", level: 3 },
    { staff_id: 39, skill_name: "換気扇清掃",   level: 2 },
    { staff_id: 39, skill_name: "機械操作",     level: 2 },
    // id:43 代表Lv5
    { staff_id: 43, skill_name: "機械操作",     level: 5 },
    { staff_id: 43, skill_name: "換気扇清掃",   level: 4 },
    { staff_id: 43, skill_name: "レンジフード清掃", level: 4 },
    { staff_id: 43, skill_name: "高所作業",     level: 4 },

    // ── supervisor（監督者）6名 ──────────────────────────
    // id:13 代表Lv4
    { staff_id: 13, skill_name: "定期清掃",     level: 4 },
    { staff_id: 13, skill_name: "顧客対応",     level: 3 },
    { staff_id: 13, skill_name: "エアコン清掃", level: 2 },
    // id:18 代表Lv5
    { staff_id: 18, skill_name: "顧客対応",     level: 5 },
    { staff_id: 18, skill_name: "定期清掃",     level: 4 },
    { staff_id: 18, skill_name: "高所作業",     level: 3 },
    // id:25 代表Lv3
    { staff_id: 25, skill_name: "定期清掃",     level: 3 },
    { staff_id: 25, skill_name: "顧客対応",     level: 2 },
    // id:28 代表Lv4
    { staff_id: 28, skill_name: "顧客対応",     level: 4 },
    { staff_id: 28, skill_name: "定期清掃",     level: 3 },
    { staff_id: 28, skill_name: "キッチン清掃", level: 2 },
    // id:34 代表Lv5
    { staff_id: 34, skill_name: "定期清掃",     level: 5 },
    { staff_id: 34, skill_name: "顧客対応",     level: 5 },
    { staff_id: 34, skill_name: "エアコン清掃", level: 3 },
    { staff_id: 34, skill_name: "高所作業",     level: 2 },
    // id:38 代表Lv3
    { staff_id: 38, skill_name: "顧客対応",     level: 3 },
    { staff_id: 38, skill_name: "定期清掃",     level: 2 },
];

const conn = await getConnection();
try {
    // スキル名 → ID マップ（skills は seed-skills.ts で投入済み前提）
    const [skillRows] = await conn.query<RowDataPacket[]>("SELECT id, name FROM skills");
    const skillMap = new Map<string, number>(skillRows.map(r => [r.name as string, r.id as number]));
    if (skillMap.size === 0) {
        throw new Error("skills マスタが空です。先に seed-skills.ts を実行してください。");
    }

    // 対象スタッフが実在＆アクティブか確認（存在しないIDはスキップ）
    const staffIds = [...new Set(STAFF_SKILL_ASSIGNMENTS.map(a => a.staff_id))];
    const [staffRows] = await conn.query<RowDataPacket[]>(
        `SELECT id FROM staffs WHERE is_active = true AND id IN (${staffIds.map(() => "?").join(",")})`,
        staffIds,
    );
    const validStaff = new Set<number>(staffRows.map(r => r.id as number));

    let inserted = 0;
    let skipped = 0;
    for (const a of STAFF_SKILL_ASSIGNMENTS) {
        const skillId = skillMap.get(a.skill_name);
        if (!skillId) { console.warn(`  スキル未定義: ${a.skill_name}`); skipped++; continue; }
        if (!validStaff.has(a.staff_id)) { console.warn(`  対象外スタッフ(id:${a.staff_id})`); skipped++; continue; }
        await conn.query(
            `INSERT INTO staff_skills (staff_id, skill_id, level, acquired_at)
             VALUES (?, ?, ?, CURDATE())
             ON DUPLICATE KEY UPDATE level=VALUES(level), updated_at=CURRENT_TIMESTAMP`,
            [a.staff_id, skillId, a.level],
        );
        inserted++;
    }

    console.log(`✅ staff_skills: ${inserted} 件投入（スキップ ${skipped} 件）`);
    console.log(`   対象スタッフ: ${validStaff.size} 名`);

    // 代表レベルの分布を確認
    const [dist] = await conn.query<RowDataPacket[]>(
        `SELECT level, COUNT(*) AS cnt FROM (
             SELECT s.id, COALESCE(MAX(ss.level), 1) AS level
             FROM staffs s LEFT JOIN staff_skills ss ON ss.staff_id = s.id
             WHERE s.is_active = true
             GROUP BY s.id
         ) t GROUP BY level ORDER BY level`,
    );
    console.log("📊 全アクティブスタッフの代表レベル分布:");
    dist.forEach(r => console.log(`   Lv${r.level}: ${r.cnt} 名`));
} finally {
    await conn.end();
}
