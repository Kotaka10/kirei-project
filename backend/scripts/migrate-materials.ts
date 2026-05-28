/**
 * 資材・ツール管理用テーブルを作成するマイグレーション
 *   - materials         : 資材・ツールマスター
 *   - service_materials : サービス種別 × 資材（標準チェックリスト）
 *
 * 実行: npx tsx scripts/migrate-materials.ts
 */
import { getConnection } from "../db/connection.js";
import dotenv from "dotenv";
dotenv.config();

const conn = await getConnection();

try {
    await conn.query(`
        CREATE TABLE IF NOT EXISTS materials (
            id          INT AUTO_INCREMENT PRIMARY KEY,
            name        VARCHAR(100) NOT NULL UNIQUE,
            category    ENUM('洗剤','道具','機材','消耗品') NOT NULL,
            unit        VARCHAR(20)  NOT NULL DEFAULT '個',
            description TEXT,
            is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
            created_at  DATETIME     DEFAULT CURRENT_TIMESTAMP
        )
    `);

    await conn.query(`
        CREATE TABLE IF NOT EXISTS service_materials (
            id                INT AUTO_INCREMENT PRIMARY KEY,
            service_type      VARCHAR(100)   NOT NULL,
            material_id       INT            NOT NULL,
            standard_quantity DECIMAL(10,2)  NOT NULL DEFAULT 1,
            is_required       BOOLEAN        NOT NULL DEFAULT TRUE
                              COMMENT 'TRUE=必須 / FALSE=あると望ましい',
            notes             VARCHAR(255),
            UNIQUE KEY uq_service_material (service_type, material_id),
            FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE CASCADE
        )
    `);

    console.log("✅ テーブル作成完了");
    console.log("   - materials");
    console.log("   - service_materials");
} finally {
    await conn.end();
}
