/**
 * スキルマスタ・サービス要件・スタッフスキルを初期投入する
 *
 * 熟練度: 1=見習い  2=初級  3=中級  4=上級  5=エキスパート
 */
import { getConnection } from "../db/connection.js";
import type { RowDataPacket } from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

// ── スキルマスタ ──────────────────────────────────────────
const SKILLS: { name: string; category: string; description: string }[] = [
    { name: "エアコン清掃",       category: "清掃", description: "エアコンのフィルター・熱交換器の洗浄" },
    { name: "キッチン清掃",       category: "清掃", description: "コンロ・シンク周りの油汚れ除去" },
    { name: "浴室清掃",           category: "清掃", description: "浴槽・タイル・カビ除去" },
    { name: "窓清掃",             category: "清掃", description: "窓ガラス・サッシの拭き上げ" },
    { name: "床清掃",             category: "清掃", description: "フローリング・カーペットの清掃・ワックスがけ" },
    { name: "換気扇清掃",         category: "技術", description: "換気扇・ダクトの分解洗浄" },
    { name: "レンジフード清掃",   category: "技術", description: "レンジフード・フィルターの分解洗浄" },
    { name: "洗面所清掃",         category: "清掃", description: "洗面台・鏡・水栓まわりの清掃" },
    { name: "定期清掃",           category: "清掃", description: "オフィス・共用部の定期巡回清掃" },
    { name: "高所作業",           category: "資格", description: "脚立・高所作業車を用いた作業（3m以上）" },
    { name: "機械操作",           category: "技術", description: "床洗浄機・ポリッシャー等の操作" },
    { name: "顧客対応",           category: "対応力", description: "クレーム対応・丁寧なコミュニケーション" },
];

// ── サービス要件（service_type → 必要スキル + 最低熟練度）──
const SERVICE_REQUIREMENTS: { service_type: string; skill_name: string; required_level: number }[] = [
    { service_type: "エアコン清掃",     skill_name: "エアコン清掃",     required_level: 2 },
    { service_type: "キッチン清掃",     skill_name: "キッチン清掃",     required_level: 1 },
    { service_type: "浴室清掃",         skill_name: "浴室清掃",         required_level: 1 },
    { service_type: "窓清掃",           skill_name: "窓清掃",           required_level: 1 },
    { service_type: "床清掃",           skill_name: "床清掃",           required_level: 1 },
    { service_type: "床清掃",           skill_name: "機械操作",         required_level: 2 },
    { service_type: "換気扇清掃",       skill_name: "換気扇清掃",       required_level: 2 },
    { service_type: "換気扇清掃",       skill_name: "機械操作",         required_level: 1 },
    { service_type: "レンジフード清掃", skill_name: "レンジフード清掃", required_level: 2 },
    { service_type: "レンジフード清掃", skill_name: "換気扇清掃",       required_level: 1 },
    { service_type: "洗面所清掃",       skill_name: "洗面所清掃",       required_level: 1 },
    { service_type: "定期清掃",         skill_name: "定期清掃",         required_level: 1 },
    { service_type: "定期清掃",         skill_name: "顧客対応",         required_level: 2 },
    { service_type: "ハウスクリーニング", skill_name: "浴室清掃",       required_level: 2 },
    { service_type: "ハウスクリーニング", skill_name: "キッチン清掃",   required_level: 2 },
    { service_type: "ハウスクリーニング", skill_name: "顧客対応",       required_level: 2 },
    { service_type: "オフィス清掃",     skill_name: "定期清掃",         required_level: 2 },
    { service_type: "オフィス清掃",     skill_name: "顧客対応",         required_level: 3 },
];

// ── スタッフスキル割り当て（staff_id 1〜9 + 71:関カンタ）──
//   role に応じてリアルな熟練度を設定
const STAFF_SKILL_ASSIGNMENTS: { staff_id: number; skill_name: string; level: number }[] = [
    // id:1 佐藤太郎 (cleaner)
    { staff_id: 1, skill_name: "エアコン清掃",   level: 3 },
    { staff_id: 1, skill_name: "キッチン清掃",   level: 4 },
    { staff_id: 1, skill_name: "浴室清掃",       level: 3 },
    { staff_id: 1, skill_name: "顧客対応",       level: 2 },
    // id:2 鈴木花子 (cleaner)
    { staff_id: 2, skill_name: "浴室清掃",       level: 5 },
    { staff_id: 2, skill_name: "洗面所清掃",     level: 4 },
    { staff_id: 2, skill_name: "キッチン清掃",   level: 3 },
    { staff_id: 2, skill_name: "顧客対応",       level: 4 },
    // id:3 高橋一郎 (technician)
    { staff_id: 3, skill_name: "エアコン清掃",   level: 5 },
    { staff_id: 3, skill_name: "換気扇清掃",     level: 4 },
    { staff_id: 3, skill_name: "レンジフード清掃", level: 4 },
    { staff_id: 3, skill_name: "機械操作",       level: 4 },
    // id:4 田中美咲 (cleaner)
    { staff_id: 4, skill_name: "窓清掃",         level: 4 },
    { staff_id: 4, skill_name: "床清掃",         level: 3 },
    { staff_id: 4, skill_name: "定期清掃",       level: 3 },
    { staff_id: 4, skill_name: "顧客対応",       level: 3 },
    // id:5 伊藤智恵 (supervisor)
    { staff_id: 5, skill_name: "定期清掃",       level: 5 },
    { staff_id: 5, skill_name: "顧客対応",       level: 5 },
    { staff_id: 5, skill_name: "エアコン清掃",   level: 3 },
    { staff_id: 5, skill_name: "高所作業",       level: 3 },
    // id:6 渡辺健 (technician)
    { staff_id: 6, skill_name: "換気扇清掃",     level: 5 },
    { staff_id: 6, skill_name: "レンジフード清掃", level: 5 },
    { staff_id: 6, skill_name: "機械操作",       level: 5 },
    { staff_id: 6, skill_name: "高所作業",       level: 4 },
    // id:7 中村直樹 (cleaner)
    { staff_id: 7, skill_name: "床清掃",         level: 4 },
    { staff_id: 7, skill_name: "機械操作",       level: 3 },
    { staff_id: 7, skill_name: "定期清掃",       level: 4 },
    { staff_id: 7, skill_name: "窓清掃",         level: 3 },
    // id:8 小林由紀 (supervisor)
    { staff_id: 8, skill_name: "顧客対応",       level: 5 },
    { staff_id: 8, skill_name: "定期清掃",       level: 4 },
    { staff_id: 8, skill_name: "キッチン清掃",   level: 4 },
    { staff_id: 8, skill_name: "浴室清掃",       level: 4 },
    // id:9 山本龍 (technician)
    { staff_id: 9, skill_name: "エアコン清掃",   level: 4 },
    { staff_id: 9, skill_name: "機械操作",       level: 5 },
    { staff_id: 9, skill_name: "換気扇清掃",     level: 3 },
    { staff_id: 9, skill_name: "高所作業",       level: 5 },
    // id:71 関カンタ (supervisor)
    { staff_id: 71, skill_name: "顧客対応",      level: 5 },
    { staff_id: 71, skill_name: "定期清掃",      level: 5 },
    { staff_id: 71, skill_name: "エアコン清掃",  level: 4 },
    { staff_id: 71, skill_name: "換気扇清掃",    level: 3 },
    { staff_id: 71, skill_name: "高所作業",      level: 2 },
];

const conn = await getConnection();
try {
    // skills 投入
    for (const s of SKILLS) {
        await conn.query(
            `INSERT INTO skills (name, category, description)
             VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE category=VALUES(category), description=VALUES(description)`,
            [s.name, s.category, s.description]
        );
    }
    console.log(`✅ skills: ${SKILLS.length} 件`);

    // スキル名 → ID マップ
    const [skillRows] = await conn.query<RowDataPacket[]>("SELECT id, name FROM skills");
    const skillMap = new Map<string, number>(skillRows.map(r => [r.name as string, r.id as number]));

    // service_skill_requirements 投入
    for (const req of SERVICE_REQUIREMENTS) {
        const skillId = skillMap.get(req.skill_name);
        if (!skillId) { console.warn(`  スキル未定義: ${req.skill_name}`); continue; }
        await conn.query(
            `INSERT INTO service_skill_requirements (service_type, skill_id, required_level)
             VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE required_level=VALUES(required_level)`,
            [req.service_type, skillId, req.required_level]
        );
    }
    console.log(`✅ service_skill_requirements: ${SERVICE_REQUIREMENTS.length} 件`);

    // staff_skills 投入
    let staffSkillCount = 0;
    for (const a of STAFF_SKILL_ASSIGNMENTS) {
        const skillId = skillMap.get(a.skill_name);
        if (!skillId) { console.warn(`  スキル未定義: ${a.skill_name}`); continue; }
        await conn.query(
            `INSERT INTO staff_skills (staff_id, skill_id, level, acquired_at)
             VALUES (?, ?, ?, CURDATE())
             ON DUPLICATE KEY UPDATE level=VALUES(level), updated_at=CURRENT_TIMESTAMP`,
            [a.staff_id, skillId, a.level]
        );
        staffSkillCount++;
    }
    console.log(`✅ staff_skills: ${staffSkillCount} 件`);
} finally {
    await conn.end();
}
