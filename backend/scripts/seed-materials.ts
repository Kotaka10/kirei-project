/**
 * 資材マスターおよびサービス種別ごとの標準チェックリストを投入する
 *
 * 実行: npx tsx scripts/seed-materials.ts
 */
import { getConnection } from "../db/connection.js";
import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

// ── 資材マスター ────────────────────────────────────────────
const MATERIALS: { name: string; category: string; unit: string; description: string }[] = [
    // 洗剤
    { name: "エアコン洗浄スプレー",     category: "洗剤",  unit: "本",   description: "熱交換器・送風ファン用の洗浄スプレー" },
    { name: "フィルター洗浄スプレー",   category: "洗剤",  unit: "本",   description: "エアコンフィルターの除菌・消臭スプレー" },
    { name: "油汚れ用洗剤",             category: "洗剤",  unit: "本",   description: "コンロ・レンジフード周りの強力油脂分解洗剤" },
    { name: "重曹",                     category: "洗剤",  unit: "袋",   description: "研磨・脱臭・油汚れ中和用" },
    { name: "クエン酸スプレー",         category: "洗剤",  unit: "本",   description: "水垢・石鹸カス除去用" },
    { name: "カビ取り洗剤",             category: "洗剤",  unit: "本",   description: "浴室・目地のカビ除去用塩素系洗剤" },
    { name: "防カビスプレー",           category: "洗剤",  unit: "本",   description: "清掃後のカビ抑制コーティング剤" },
    { name: "浴室用洗剤",               category: "洗剤",  unit: "本",   description: "浴槽・浴室タイル全般の中性洗剤" },
    { name: "ガラスクリーナー",         category: "洗剤",  unit: "本",   description: "窓ガラス・鏡の油膜・汚れ除去" },
    { name: "多目的クリーナー",         category: "洗剤",  unit: "本",   description: "床・家具・設備全般に使える中性洗剤" },
    { name: "床用洗剤",                 category: "洗剤",  unit: "本",   description: "フローリング・タイル床専用洗剤" },
    { name: "フロアポリッシュ",         category: "洗剤",  unit: "本",   description: "フローリング床の保護・光沢仕上げ剤" },
    { name: "水垢除去剤",               category: "洗剤",  unit: "本",   description: "洗面台・水栓の頑固な水垢除去用" },
    // 道具
    { name: "ブラシセット",             category: "道具",  unit: "セット", description: "各種隙間・フィン・排水口用ブラシセット" },
    { name: "スクレーパー",             category: "道具",  unit: "本",   description: "焦げ付き・シール剥がし用金属スクレーパー" },
    { name: "スクイージー",             category: "道具",  unit: "本",   description: "窓ガラス・鏡用水切りワイパー" },
    { name: "モップ",                   category: "道具",  unit: "本",   description: "床の水拭き・洗浄用モップ" },
    { name: "バケツ",                   category: "道具",  unit: "個",   description: "洗浄液・すすぎ水用バケツ" },
    { name: "伸縮式ポール",             category: "道具",  unit: "本",   description: "高所窓・天井付近の作業用伸縮ポール" },
    { name: "スクラビングブラシ",       category: "道具",  unit: "本",   description: "浴室タイル・目地のこすり洗い用ブラシ" },
    // 機材
    { name: "掃除機",                   category: "機材",  unit: "台",   description: "粉塵・ゴミの吸引用業務用掃除機" },
    { name: "ポリッシャー",             category: "機材",  unit: "台",   description: "床の研磨・ワックスがけ用回転機" },
    { name: "圧縮エアスプレー",         category: "機材",  unit: "本",   description: "フィン・基板周りの粉塵飛ばし用" },
    // 消耗品
    { name: "マイクロファイバークロス", category: "消耗品", unit: "枚",  description: "拭き上げ・仕上げ用超細繊維クロス" },
    { name: "ウエス",                   category: "消耗品", unit: "枚",  description: "汚れ拭き取り・吸水用使い捨てクロス" },
    { name: "スポンジ",                 category: "消耗品", unit: "個",  description: "洗浄・泡立て用両面スポンジ" },
    { name: "ゴム手袋",                 category: "消耗品", unit: "双",  description: "洗剤・汚れから手を守る耐薬品性手袋" },
    { name: "養生シート",               category: "消耗品", unit: "枚",  description: "床・壁面の養生・水濡れ防止シート" },
    { name: "養生テープ",               category: "消耗品", unit: "巻",  description: "養生シート固定・マスキング用テープ" },
    { name: "ゴミ袋",                   category: "消耗品", unit: "枚",  description: "廃材・汚れた消耗品の廃棄用袋" },
];

// ── サービス種別 × 資材マッピング ───────────────────────────
// is_required: true=必須 / false=あると望ましい
type MaterialEntry = { material_name: string; qty: number; required: boolean; notes?: string };
const SERVICE_MATERIALS: Record<string, MaterialEntry[]> = {
    "エアコン清掃": [
        { material_name: "エアコン洗浄スプレー",     qty: 1, required: true  },
        { material_name: "フィルター洗浄スプレー",   qty: 1, required: true  },
        { material_name: "ブラシセット",             qty: 1, required: true  },
        { material_name: "養生シート",               qty: 2, required: true,  notes: "床・壁面の水濡れ防止" },
        { material_name: "養生テープ",               qty: 1, required: true  },
        { material_name: "マイクロファイバークロス", qty: 3, required: true  },
        { material_name: "ウエス",                   qty: 5, required: true  },
        { material_name: "ゴム手袋",                 qty: 1, required: true  },
        { material_name: "バケツ",                   qty: 1, required: true  },
        { material_name: "圧縮エアスプレー",         qty: 1, required: false, notes: "フィン詰まりが激しい場合に有効" },
        { material_name: "ゴミ袋",                   qty: 2, required: true  },
    ],
    "キッチン清掃": [
        { material_name: "油汚れ用洗剤",             qty: 1, required: true  },
        { material_name: "重曹",                     qty: 1, required: true  },
        { material_name: "クエン酸スプレー",         qty: 1, required: false, notes: "水垢がある場合に使用" },
        { material_name: "スポンジ",                 qty: 3, required: true  },
        { material_name: "スクレーパー",             qty: 1, required: true  },
        { material_name: "ウエス",                   qty: 5, required: true  },
        { material_name: "ゴム手袋",                 qty: 1, required: true  },
        { material_name: "ゴミ袋",                   qty: 3, required: true  },
    ],
    "浴室清掃": [
        { material_name: "カビ取り洗剤",             qty: 1, required: true  },
        { material_name: "防カビスプレー",           qty: 1, required: true,  notes: "清掃後に必ず吹き付ける" },
        { material_name: "浴室用洗剤",               qty: 1, required: true  },
        { material_name: "スクラビングブラシ",       qty: 1, required: true  },
        { material_name: "スポンジ",                 qty: 3, required: true  },
        { material_name: "マイクロファイバークロス", qty: 3, required: true  },
        { material_name: "ゴム手袋",                 qty: 1, required: true  },
        { material_name: "ゴミ袋",                   qty: 2, required: true  },
    ],
    "窓清掃": [
        { material_name: "ガラスクリーナー",         qty: 1, required: true  },
        { material_name: "スクイージー",             qty: 1, required: true  },
        { material_name: "マイクロファイバークロス", qty: 5, required: true  },
        { material_name: "バケツ",                   qty: 1, required: true  },
        { material_name: "ウエス",                   qty: 3, required: true  },
        { material_name: "伸縮式ポール",             qty: 1, required: false, notes: "2階以上の窓がある場合に持参" },
    ],
    "定期清掃": [
        { material_name: "多目的クリーナー",         qty: 1, required: true  },
        { material_name: "モップ",                   qty: 1, required: true  },
        { material_name: "バケツ",                   qty: 1, required: true  },
        { material_name: "マイクロファイバークロス", qty: 5, required: true  },
        { material_name: "ウエス",                   qty: 5, required: true  },
        { material_name: "ゴム手袋",                 qty: 1, required: true  },
        { material_name: "掃除機",                   qty: 1, required: true  },
        { material_name: "ゴミ袋",                   qty: 5, required: true  },
    ],
    "床清掃": [
        { material_name: "床用洗剤",                 qty: 1, required: true  },
        { material_name: "モップ",                   qty: 1, required: true  },
        { material_name: "バケツ",                   qty: 1, required: true  },
        { material_name: "マイクロファイバークロス", qty: 3, required: true  },
        { material_name: "ゴム手袋",                 qty: 1, required: true  },
        { material_name: "フロアポリッシュ",         qty: 1, required: false, notes: "ワックスがけが必要な場合" },
        { material_name: "ポリッシャー",             qty: 1, required: false, notes: "広面積またはワックスがけの場合に持参" },
    ],
    "換気扇清掃": [
        { material_name: "油汚れ用洗剤",             qty: 1, required: true  },
        { material_name: "重曹",                     qty: 1, required: true  },
        { material_name: "ブラシセット",             qty: 1, required: true  },
        { material_name: "スポンジ",                 qty: 2, required: true  },
        { material_name: "ウエス",                   qty: 5, required: true  },
        { material_name: "ゴム手袋",                 qty: 1, required: true  },
        { material_name: "養生シート",               qty: 1, required: true,  notes: "床への油汚れ落下防止" },
        { material_name: "バケツ",                   qty: 1, required: true  },
        { material_name: "ゴミ袋",                   qty: 2, required: true  },
    ],
    "レンジフード清掃": [
        { material_name: "油汚れ用洗剤",             qty: 1, required: true  },
        { material_name: "重曹",                     qty: 1, required: true  },
        { material_name: "ブラシセット",             qty: 1, required: true  },
        { material_name: "スポンジ",                 qty: 2, required: true  },
        { material_name: "ウエス",                   qty: 5, required: true  },
        { material_name: "ゴム手袋",                 qty: 1, required: true  },
        { material_name: "養生シート",               qty: 1, required: true,  notes: "コンロ・床への油汚れ防止" },
        { material_name: "バケツ",                   qty: 1, required: true  },
        { material_name: "ゴミ袋",                   qty: 2, required: true  },
    ],
    "洗面所清掃": [
        { material_name: "水垢除去剤",               qty: 1, required: true  },
        { material_name: "クエン酸スプレー",         qty: 1, required: true  },
        { material_name: "スポンジ",                 qty: 2, required: true  },
        { material_name: "マイクロファイバークロス", qty: 3, required: true  },
        { material_name: "ウエス",                   qty: 3, required: true  },
        { material_name: "ゴム手袋",                 qty: 1, required: true  },
    ],
};

// ── 投入処理 ───────────────────────────────────────────────
const conn = await getConnection();

try {
    // 1. 資材マスター INSERT IGNORE
    for (const m of MATERIALS) {
        await conn.query(
            `INSERT IGNORE INTO materials (name, category, unit, description) VALUES (?, ?, ?, ?)`,
            [m.name, m.category, m.unit, m.description]
        );
    }
    console.log(`✅ materials: ${MATERIALS.length} 件投入`);

    // 2. 名前 → ID マップを構築
    const [rows] = await conn.query<RowDataPacket[]>(
        `SELECT id, name FROM materials`
    );
    const materialIdMap = new Map<string, number>(rows.map(r => [r.name as string, r.id as number]));

    // 3. service_materials INSERT IGNORE
    let smCount = 0;
    for (const [serviceType, entries] of Object.entries(SERVICE_MATERIALS)) {
        for (const entry of entries) {
            const materialId = materialIdMap.get(entry.material_name);
            if (!materialId) {
                console.warn(`  ⚠ 資材が見つかりません: ${entry.material_name}`);
                continue;
            }
            await conn.query<ResultSetHeader>(
                `INSERT IGNORE INTO service_materials
                 (service_type, material_id, standard_quantity, is_required, notes)
                 VALUES (?, ?, ?, ?, ?)`,
                [serviceType, materialId, entry.qty, entry.required, entry.notes ?? null]
            );
            smCount++;
        }
    }
    console.log(`✅ service_materials: ${smCount} 件投入`);
    console.log("   対象サービス:", Object.keys(SERVICE_MATERIALS).join(" / "));
} finally {
    await conn.end();
}
