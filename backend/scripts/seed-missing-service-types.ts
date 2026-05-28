/**
 * カバー漏れのサービス種別（トイレ清掃・洗濯機清掃・窓ガラス清掃）を補完する
 *   1. materials      : 新規資材を追加
 *   2. service_materials : 3種別の標準チェックリストを追加
 *   3. booking_materials : 過去ジョブに実績データを投入
 *
 * 実行: npx tsx scripts/seed-missing-service-types.ts
 */
import { getConnection } from "../db/connection.js";
import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

// ── 追加資材 ───────────────────────────────────────────────
const NEW_MATERIALS = [
    { name: "トイレ用洗剤",     category: "洗剤",  unit: "本",   description: "便器・タンク・床まわりの除菌・洗浄用洗剤" },
    { name: "除菌スプレー",     category: "洗剤",  unit: "本",   description: "便座・ドア・スイッチ等の接触面を除菌するスプレー" },
    { name: "トイレブラシ",     category: "道具",  unit: "本",   description: "便器内部の洗浄用ブラシ（使い捨てタイプ）" },
    { name: "洗濯槽クリーナー", category: "洗剤",  unit: "本",   description: "洗濯槽の黒カビ・雑菌を除去する専用クリーナー" },
    { name: "洗濯機用洗浄剤",   category: "洗剤",  unit: "本",   description: "外装・パッキン・排水部の洗浄に使う中性洗浄剤" },
];

// ── 標準チェックリスト ─────────────────────────────────────
type SM = { material_name: string; qty: number; required: boolean; notes?: string };
const SERVICE_MATERIALS: Record<string, SM[]> = {
    "トイレ清掃": [
        { material_name: "トイレ用洗剤",             qty: 1, required: true  },
        { material_name: "除菌スプレー",             qty: 1, required: true,  notes: "便座・ドア等の接触面に使用" },
        { material_name: "トイレブラシ",             qty: 1, required: true  },
        { material_name: "スポンジ",                 qty: 2, required: true  },
        { material_name: "マイクロファイバークロス", qty: 3, required: true  },
        { material_name: "ウエス",                   qty: 3, required: true  },
        { material_name: "ゴム手袋",                 qty: 1, required: true  },
        { material_name: "ゴミ袋",                   qty: 2, required: true  },
    ],
    "洗濯機清掃": [
        { material_name: "洗濯槽クリーナー",         qty: 1, required: true  },
        { material_name: "洗濯機用洗浄剤",           qty: 1, required: true  },
        { material_name: "ブラシセット",             qty: 1, required: true  },
        { material_name: "スポンジ",                 qty: 2, required: true  },
        { material_name: "マイクロファイバークロス", qty: 3, required: true  },
        { material_name: "ウエス",                   qty: 3, required: true  },
        { material_name: "ゴム手袋",                 qty: 1, required: true  },
        { material_name: "バケツ",                   qty: 1, required: true  },
    ],
    "窓ガラス清掃": [
        { material_name: "ガラスクリーナー",         qty: 1, required: true  },
        { material_name: "スクイージー",             qty: 1, required: true  },
        { material_name: "マイクロファイバークロス", qty: 5, required: true  },
        { material_name: "バケツ",                   qty: 1, required: true  },
        { material_name: "ウエス",                   qty: 3, required: true  },
        { material_name: "伸縮式ポール",             qty: 1, required: false, notes: "2階以上の窓がある場合に持参" },
    ],
};

// ── 過去実績パターン ───────────────────────────────────────
type BM = { name: string; qty: number; notes?: string };
const HISTORICAL_PATTERNS: Record<string, BM[][]> = {
    "トイレ清掃": [
        [
            { name: "トイレ用洗剤",             qty: 1 },
            { name: "除菌スプレー",             qty: 1 },
            { name: "トイレブラシ",             qty: 1 },
            { name: "スポンジ",                 qty: 2 },
            { name: "マイクロファイバークロス", qty: 3 },
            { name: "ウエス",                   qty: 3 },
            { name: "ゴム手袋",                 qty: 1 },
            { name: "ゴミ袋",                   qty: 2 },
        ],
        [
            { name: "トイレ用洗剤",             qty: 2, notes: "汚れが酷かったため2本使用" },
            { name: "除菌スプレー",             qty: 1 },
            { name: "トイレブラシ",             qty: 1 },
            { name: "スポンジ",                 qty: 3 },
            { name: "マイクロファイバークロス", qty: 4 },
            { name: "ウエス",                   qty: 5 },
            { name: "ゴム手袋",                 qty: 2 },
            { name: "ゴミ袋",                   qty: 3 },
        ],
        [
            { name: "トイレ用洗剤",             qty: 1 },
            { name: "除菌スプレー",             qty: 2, notes: "個室が複数あったため2本使用" },
            { name: "トイレブラシ",             qty: 2, notes: "個室2つ分" },
            { name: "スポンジ",                 qty: 2 },
            { name: "マイクロファイバークロス", qty: 5 },
            { name: "ウエス",                   qty: 4 },
            { name: "ゴム手袋",                 qty: 1 },
            { name: "ゴミ袋",                   qty: 2 },
        ],
    ],
    "洗濯機清掃": [
        [
            { name: "洗濯槽クリーナー",         qty: 1 },
            { name: "洗濯機用洗浄剤",           qty: 1 },
            { name: "ブラシセット",             qty: 1 },
            { name: "スポンジ",                 qty: 2 },
            { name: "マイクロファイバークロス", qty: 3 },
            { name: "ウエス",                   qty: 3 },
            { name: "ゴム手袋",                 qty: 1 },
            { name: "バケツ",                   qty: 1 },
        ],
        [
            { name: "洗濯槽クリーナー",         qty: 2, notes: "カビが多く2サイクル洗浄のため2本使用" },
            { name: "洗濯機用洗浄剤",           qty: 1 },
            { name: "ブラシセット",             qty: 1 },
            { name: "スポンジ",                 qty: 3 },
            { name: "マイクロファイバークロス", qty: 4 },
            { name: "ウエス",                   qty: 5 },
            { name: "ゴム手袋",                 qty: 1 },
            { name: "バケツ",                   qty: 1 },
        ],
        [
            { name: "洗濯槽クリーナー",         qty: 1 },
            { name: "洗濯機用洗浄剤",           qty: 1 },
            { name: "ブラシセット",             qty: 1 },
            { name: "スポンジ",                 qty: 2 },
            { name: "マイクロファイバークロス", qty: 3 },
            { name: "ウエス",                   qty: 3 },
            { name: "ゴム手袋",                 qty: 1 },
            { name: "バケツ",                   qty: 1 },
        ],
    ],
    "窓ガラス清掃": [
        [
            { name: "ガラスクリーナー",         qty: 1 },
            { name: "スクイージー",             qty: 1 },
            { name: "マイクロファイバークロス", qty: 5 },
            { name: "バケツ",                   qty: 1 },
            { name: "ウエス",                   qty: 3 },
        ],
        [
            { name: "ガラスクリーナー",         qty: 2, notes: "窓枚数が多かったため2本使用" },
            { name: "スクイージー",             qty: 1 },
            { name: "マイクロファイバークロス", qty: 8 },
            { name: "バケツ",                   qty: 1 },
            { name: "ウエス",                   qty: 5 },
            { name: "伸縮式ポール",             qty: 1, notes: "2階の窓清掃があったため持参" },
        ],
        [
            { name: "ガラスクリーナー",         qty: 1 },
            { name: "スクイージー",             qty: 1 },
            { name: "マイクロファイバークロス", qty: 6 },
            { name: "バケツ",                   qty: 1 },
            { name: "ウエス",                   qty: 4 },
        ],
    ],
};

async function main() {
    const conn = await getConnection();
    try {
        // ① 新規資材を追加
        for (const m of NEW_MATERIALS) {
            await conn.query(
                `INSERT IGNORE INTO materials (name, category, unit, description) VALUES (?, ?, ?, ?)`,
                [m.name, m.category, m.unit, m.description]
            );
        }
        console.log(`✅ materials: ${NEW_MATERIALS.length} 件追加`);

        // ② 資材名 → ID マップを構築
        const [matRows] = await conn.query<RowDataPacket[]>(`SELECT id, name FROM materials`);
        const nameToId = new Map<string, number>(matRows.map(r => [r.name as string, r.id as number]));

        // ③ service_materials を追加
        let smCount = 0;
        for (const [serviceType, items] of Object.entries(SERVICE_MATERIALS)) {
            for (const item of items) {
                const matId = nameToId.get(item.material_name);
                if (!matId) { console.warn(`  ⚠ 資材が見つかりません: ${item.material_name}`); continue; }
                await conn.query(
                    `INSERT IGNORE INTO service_materials (service_type, material_id, standard_quantity, is_required, notes)
                     VALUES (?, ?, ?, ?, ?)`,
                    [serviceType, matId, item.qty, item.required, item.notes ?? null]
                );
                smCount++;
            }
        }
        console.log(`✅ service_materials: ${smCount} 件追加`);

        // ④ 過去ジョブに booking_materials を投入
        const targetTypes = Object.keys(HISTORICAL_PATTERNS);
        const placeholders = targetTypes.map(() => "?").join(",");
        const [pastBookings] = await conn.query<RowDataPacket[]>(
            `SELECT b.id AS booking_id, b.service_type, b.staff_id
             FROM bookings b
             WHERE b.service_type IN (${placeholders})
               AND b.scheduled_at < NOW()
               AND b.status != 'cancelled'
             ORDER BY b.service_type, b.scheduled_at DESC`,
            targetTypes
        );

        if (pastBookings.length === 0) {
            console.log("⚠ 対象の過去ジョブが見つかりませんでした");
            return;
        }

        const processed = new Map<string, number>();
        let bmCount = 0;

        for (const booking of pastBookings) {
            const st: string = booking.service_type;
            const count      = processed.get(st) ?? 0;
            const patterns   = HISTORICAL_PATTERNS[st];
            if (!patterns || count >= Math.min(patterns.length, 5)) continue;

            const pattern = patterns[count % patterns.length]!;
            const staffId = booking.staff_id ?? 1;

            for (const item of pattern) {
                const matId = nameToId.get(item.name) ?? null;
                await conn.query<ResultSetHeader>(
                    `INSERT IGNORE INTO booking_materials
                     (booking_id, material_id, material_name, qty_used, notes, recorded_by)
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [booking.booking_id, matId, item.name, item.qty, item.notes ?? null, staffId]
                );
                bmCount++;
            }
            processed.set(st, count + 1);
        }

        console.log(`✅ booking_materials: ${bmCount} 件追加`);
        console.log("   対象:", [...processed.entries()].map(([st, n]) => `${st}×${n}件`).join(" / "));
    } finally {
        await conn.end();
    }
}

await main();
