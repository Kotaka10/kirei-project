/**
 * ジョブ実績資材テーブルを作成するマイグレーション
 *   - booking_materials: ジョブごとの実際の使用資材を記録
 *
 * 実行: npx tsx scripts/migrate-booking-materials.ts
 */
import { getConnection } from "../db/connection.js";
import dotenv from "dotenv";
dotenv.config();

const conn = await getConnection();

try {
    await conn.query(`
        CREATE TABLE IF NOT EXISTS booking_materials (
            id            INT           AUTO_INCREMENT PRIMARY KEY,
            booking_id    INT           NOT NULL,
            material_id   INT           DEFAULT NULL
                          COMMENT 'materials マスターの ID（マスター外の場合は NULL）',
            material_name VARCHAR(100)  NOT NULL
                          COMMENT '資材名（マスター外でも直接入力可）',
            qty_used      DECIMAL(10,2) NOT NULL DEFAULT 1,
            notes         VARCHAR(255)  DEFAULT NULL,
            recorded_by   INT           NOT NULL COMMENT '記録したスタッフの staff_id',
            recorded_at   DATETIME      DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY uq_booking_material (booking_id, material_name),
            FOREIGN KEY (booking_id)  REFERENCES bookings(id)  ON DELETE CASCADE,
            FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE SET NULL,
            FOREIGN KEY (recorded_by) REFERENCES staffs(id)
        )
    `);

    console.log("✅ テーブル作成完了");
    console.log("   - booking_materials");
} finally {
    await conn.end();
}
