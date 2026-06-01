/**
 * estimate_templates に不足サービスを追加する
 *   - 床清掃        : 基本清掃（ワックスなし）
 *   - レンジフード清掃: 油汚れ特化
 *   - 洗面所清掃    : 水垢・カビ取り
 *
 * ※ 浴室清掃は既に登録済みのためスキップ
 *
 * 実行: npx tsx scripts/seed-estimate-service-types.ts
 */
import { getConnection } from "../db/connection.js";
import dotenv from "dotenv";
dotenv.config();

const NEW_TEMPLATES = [
    {
        service_type:           "床清掃",
        base_price:             6000,
        price_per_unit:         80,
        unit_type:              "平米",
        normal_multiplier:      1.0,
        dirty_multiplier:       1.2,
        very_dirty_multiplier:  1.5,
        min_price:              6000,
        notes:                  "ポリッシャー・モップによる基本清掃。ワックス塗布は別途「床ワックス」をご利用ください。",
    },
    {
        service_type:           "レンジフード清掃",
        base_price:             8000,
        price_per_unit:         4000,
        unit_type:              "台",
        normal_multiplier:      1.0,
        dirty_multiplier:       1.4,
        very_dirty_multiplier:  1.8,
        min_price:              8000,
        notes:                  "フィルター・ファン・本体内部の油汚れ除去を含む。汚れ度により大きく変動します。",
    },
    {
        service_type:           "洗面所清掃",
        base_price:             5000,
        price_per_unit:         null,
        unit_type:              null,
        normal_multiplier:      1.0,
        dirty_multiplier:       1.2,
        very_dirty_multiplier:  1.5,
        min_price:              5000,
        notes:                  "洗面台・鏡・蛇口まわりの水垢・カビ取りを含む。",
    },
] as const;

async function main() {
    const conn = await getConnection();
    try {
        let added = 0;
        let skipped = 0;

        for (const tmpl of NEW_TEMPLATES) {
            const [exist] = await conn.query<any[]>(
                `SELECT id FROM estimate_templates WHERE service_type = ? LIMIT 1`,
                [tmpl.service_type]
            );
            if (exist.length > 0) {
                console.log(`  ⏭  スキップ（既存）: ${tmpl.service_type}`);
                skipped++;
                continue;
            }

            await conn.execute(
                `INSERT INTO estimate_templates
                 (service_type, base_price, price_per_unit, unit_type,
                  normal_multiplier, dirty_multiplier, very_dirty_multiplier,
                  min_price, notes)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    tmpl.service_type,
                    tmpl.base_price,
                    tmpl.price_per_unit,
                    tmpl.unit_type,
                    tmpl.normal_multiplier,
                    tmpl.dirty_multiplier,
                    tmpl.very_dirty_multiplier,
                    tmpl.min_price,
                    tmpl.notes,
                ]
            );
            console.log(`  ✅ 追加: ${tmpl.service_type}`);
            added++;
        }

        console.log(`\n完了 — 追加: ${added} 件 / スキップ: ${skipped} 件`);
    } finally {
        await conn.end();
    }
}

await main();