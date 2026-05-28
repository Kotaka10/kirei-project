/**
 * 過去の予約に対して使用資材の実績データを投入する
 *
 * - 過去ジョブ（scheduled_at < NOW()）のうちサービス種別ごとに最大5件を対象
 * - 各ジョブに標準リスト準拠の使用実績 + ランダムな差異（数量増減・追加資材）を付与
 *
 * 実行: npx tsx scripts/seed-booking-materials.ts
 */
import { getConnection } from "../db/connection.js";
import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

// サービス種別ごとの実績パターン（標準リストに対するバリエーション）
type MaterialRecord = { name: string; qty: number; notes?: string };
const HISTORICAL_PATTERNS: Record<string, MaterialRecord[][]> = {
    "エアコン清掃": [
        [
            { name: "エアコン洗浄スプレー",     qty: 1 },
            { name: "フィルター洗浄スプレー",   qty: 1 },
            { name: "ブラシセット",             qty: 1 },
            { name: "養生シート",               qty: 2 },
            { name: "養生テープ",               qty: 1 },
            { name: "マイクロファイバークロス", qty: 3 },
            { name: "ウエス",                   qty: 5 },
            { name: "ゴム手袋",                 qty: 1 },
            { name: "バケツ",                   qty: 1 },
        ],
        [
            { name: "エアコン洗浄スプレー",     qty: 2, notes: "汚れが激しかったため2本使用" },
            { name: "フィルター洗浄スプレー",   qty: 1 },
            { name: "ブラシセット",             qty: 1 },
            { name: "養生シート",               qty: 3, notes: "2台分のため多めに使用" },
            { name: "養生テープ",               qty: 1 },
            { name: "マイクロファイバークロス", qty: 5 },
            { name: "ウエス",                   qty: 8 },
            { name: "ゴム手袋",                 qty: 2 },
            { name: "バケツ",                   qty: 1 },
            { name: "圧縮エアスプレー",         qty: 1, notes: "フィン詰まりがあったため使用" },
        ],
        [
            { name: "エアコン洗浄スプレー",     qty: 1 },
            { name: "フィルター洗浄スプレー",   qty: 2 },
            { name: "ブラシセット",             qty: 1 },
            { name: "養生シート",               qty: 2 },
            { name: "養生テープ",               qty: 1 },
            { name: "マイクロファイバークロス", qty: 4 },
            { name: "ウエス",                   qty: 6 },
            { name: "ゴム手袋",                 qty: 1 },
            { name: "バケツ",                   qty: 1 },
            { name: "ゴミ袋",                   qty: 2 },
        ],
    ],
    "キッチン清掃": [
        [
            { name: "油汚れ用洗剤",   qty: 1 },
            { name: "重曹",           qty: 1 },
            { name: "スポンジ",       qty: 3 },
            { name: "スクレーパー",   qty: 1 },
            { name: "ウエス",         qty: 5 },
            { name: "ゴム手袋",       qty: 1 },
            { name: "ゴミ袋",         qty: 3 },
        ],
        [
            { name: "油汚れ用洗剤",     qty: 2, notes: "コンロ周りの汚れが堆積していたため2本使用" },
            { name: "重曹",             qty: 1 },
            { name: "クエン酸スプレー", qty: 1, notes: "シンク周りの水垢除去に使用" },
            { name: "スポンジ",         qty: 4 },
            { name: "スクレーパー",     qty: 1 },
            { name: "ウエス",           qty: 8 },
            { name: "ゴム手袋",         qty: 1 },
            { name: "ゴミ袋",           qty: 5 },
        ],
        [
            { name: "油汚れ用洗剤",   qty: 1 },
            { name: "重曹",           qty: 1 },
            { name: "スポンジ",       qty: 3 },
            { name: "スクレーパー",   qty: 1 },
            { name: "ウエス",         qty: 4 },
            { name: "ゴム手袋",       qty: 1 },
            { name: "ゴミ袋",         qty: 2 },
        ],
    ],
    "浴室清掃": [
        [
            { name: "カビ取り洗剤",             qty: 1 },
            { name: "防カビスプレー",           qty: 1 },
            { name: "浴室用洗剤",               qty: 1 },
            { name: "スクラビングブラシ",       qty: 1 },
            { name: "スポンジ",                 qty: 3 },
            { name: "マイクロファイバークロス", qty: 3 },
            { name: "ゴム手袋",                 qty: 1 },
            { name: "ゴミ袋",                   qty: 2 },
        ],
        [
            { name: "カビ取り洗剤",             qty: 2, notes: "タイル目地のカビが多かったため2本使用" },
            { name: "防カビスプレー",           qty: 1 },
            { name: "浴室用洗剤",               qty: 1 },
            { name: "スクラビングブラシ",       qty: 1 },
            { name: "スポンジ",                 qty: 4 },
            { name: "マイクロファイバークロス", qty: 4 },
            { name: "ゴム手袋",                 qty: 2 },
            { name: "ゴミ袋",                   qty: 2 },
        ],
    ],
    "換気扇清掃": [
        [
            { name: "油汚れ用洗剤", qty: 1 },
            { name: "重曹",         qty: 1 },
            { name: "ブラシセット", qty: 1 },
            { name: "スポンジ",     qty: 2 },
            { name: "ウエス",       qty: 5 },
            { name: "ゴム手袋",     qty: 1 },
            { name: "養生シート",   qty: 1 },
            { name: "バケツ",       qty: 1 },
            { name: "ゴミ袋",       qty: 2 },
        ],
        [
            { name: "油汚れ用洗剤", qty: 2, notes: "長期放置の油汚れのため2本使用" },
            { name: "重曹",         qty: 2 },
            { name: "ブラシセット", qty: 1 },
            { name: "スポンジ",     qty: 3 },
            { name: "ウエス",       qty: 8 },
            { name: "ゴム手袋",     qty: 2 },
            { name: "養生シート",   qty: 2 },
            { name: "バケツ",       qty: 1 },
            { name: "ゴミ袋",       qty: 4 },
        ],
    ],
    "レンジフード清掃": [
        [
            { name: "油汚れ用洗剤", qty: 1 },
            { name: "重曹",         qty: 1 },
            { name: "ブラシセット", qty: 1 },
            { name: "スポンジ",     qty: 2 },
            { name: "ウエス",       qty: 5 },
            { name: "ゴム手袋",     qty: 1 },
            { name: "養生シート",   qty: 1 },
            { name: "バケツ",       qty: 1 },
            { name: "ゴミ袋",       qty: 2 },
        ],
    ],
    "窓清掃": [
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
    ],
    "定期清掃": [
        [
            { name: "多目的クリーナー",         qty: 1 },
            { name: "モップ",                   qty: 1 },
            { name: "バケツ",                   qty: 1 },
            { name: "マイクロファイバークロス", qty: 5 },
            { name: "ウエス",                   qty: 5 },
            { name: "ゴム手袋",                 qty: 1 },
            { name: "掃除機",                   qty: 1 },
            { name: "ゴミ袋",                   qty: 5 },
        ],
    ],
    "床清掃": [
        [
            { name: "床用洗剤",                 qty: 1 },
            { name: "モップ",                   qty: 1 },
            { name: "バケツ",                   qty: 1 },
            { name: "マイクロファイバークロス", qty: 3 },
            { name: "ゴム手袋",                 qty: 1 },
        ],
        [
            { name: "床用洗剤",                 qty: 1 },
            { name: "フロアポリッシュ",         qty: 1, notes: "ワックスがけを実施" },
            { name: "モップ",                   qty: 1 },
            { name: "バケツ",                   qty: 1 },
            { name: "マイクロファイバークロス", qty: 4 },
            { name: "ゴム手袋",                 qty: 1 },
            { name: "ポリッシャー",             qty: 1, notes: "広面積のためポリッシャー使用" },
        ],
    ],
    "洗面所清掃": [
        [
            { name: "水垢除去剤",               qty: 1 },
            { name: "クエン酸スプレー",         qty: 1 },
            { name: "スポンジ",                 qty: 2 },
            { name: "マイクロファイバークロス", qty: 3 },
            { name: "ウエス",                   qty: 3 },
            { name: "ゴム手袋",                 qty: 1 },
        ],
    ],
};

async function main() {
    const conn = await getConnection();

    try {
        // 過去のジョブをサービス種別ごとに取得
        const [pastBookings] = await conn.query<RowDataPacket[]>(
            `SELECT b.id AS booking_id, b.service_type, b.staff_id
             FROM bookings b
             WHERE b.scheduled_at < NOW()
               AND b.status != 'cancelled'
             ORDER BY b.service_type, b.scheduled_at DESC`
        );

        if (pastBookings.length === 0) {
            console.log("⚠ 過去のジョブが存在しません。seed-today-bookings.ts を先に実行してください。");
            return;
        }

        // 資材名 → ID マップを構築
        const [materialRows] = await conn.query<RowDataPacket[]>(`SELECT id, name FROM materials`);
        const materialIdMap = new Map<string, number>(materialRows.map(r => [r.name as string, r.id as number]));

        // サービス種別ごとに最大5件を対象にシード
        const processed = new Map<string, number>(); // service_type → 処理件数
        let insertCount = 0;

        for (const booking of pastBookings) {
            const st: string = booking.service_type;
            const count      = processed.get(st) ?? 0;
            const patterns   = HISTORICAL_PATTERNS[st];

            if (!patterns || count >= Math.min(patterns.length, 5)) continue;

            const pattern = patterns[count % patterns.length]!;
            const staffId = booking.staff_id ?? 1;

            for (const item of pattern) {
                const materialId = materialIdMap.get(item.name) ?? null;
                await conn.query<ResultSetHeader>(
                    `INSERT IGNORE INTO booking_materials
                     (booking_id, material_id, material_name, qty_used, notes, recorded_by)
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [booking.booking_id, materialId, item.name, item.qty, item.notes ?? null, staffId]
                );
                insertCount++;
            }

            processed.set(st, count + 1);
        }

        console.log(`✅ booking_materials: ${insertCount} 件投入`);
        console.log("   対象ジョブ数:", [...processed.entries()].map(([st, n]) => `${st}×${n}件`).join(" / "));
    } finally {
        await conn.end();
    }
}

await main();
