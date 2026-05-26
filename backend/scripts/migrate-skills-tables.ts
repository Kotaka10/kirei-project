/**
 * スキルマッチング用テーブルを作成するマイグレーション
 *   - skills                    : スキルマスタ
 *   - staff_skills              : スタッフ × スキル（熟練度 1〜5）
 *   - service_skill_requirements: サービス種別に必要なスキルと最低熟練度
 */
import { getConnection } from "../db/connection.js";
import dotenv from "dotenv";
dotenv.config();

const conn = await getConnection();

try {
    await conn.query(`
        CREATE TABLE IF NOT EXISTS skills (
            id          INT AUTO_INCREMENT PRIMARY KEY,
            name        VARCHAR(100) NOT NULL UNIQUE,
            category    ENUM('清掃','技術','資格','対応力') NOT NULL,
            description TEXT,
            created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    await conn.query(`
        CREATE TABLE IF NOT EXISTS staff_skills (
            id          INT AUTO_INCREMENT PRIMARY KEY,
            staff_id    INT NOT NULL,
            skill_id    INT NOT NULL,
            level       TINYINT NOT NULL DEFAULT 1
                        COMMENT '1:見習い 2:初級 3:中級 4:上級 5:エキスパート',
            acquired_at DATE,
            updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY uq_staff_skill (staff_id, skill_id),
            FOREIGN KEY (staff_id) REFERENCES staffs(id)  ON DELETE CASCADE,
            FOREIGN KEY (skill_id) REFERENCES skills(id)  ON DELETE CASCADE,
            CONSTRAINT chk_level CHECK (level BETWEEN 1 AND 5)
        )
    `);

    // on delete cascade ＝ 親が削除されたら子も削除する
    await conn.query(`
        CREATE TABLE IF NOT EXISTS service_skill_requirements (
            id             INT AUTO_INCREMENT PRIMARY KEY,
            service_type   VARCHAR(100) NOT NULL,
            skill_id       INT NOT NULL,
            required_level TINYINT NOT NULL DEFAULT 1,
            UNIQUE KEY uq_service_skill (service_type, skill_id),
            FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE, 
            CONSTRAINT chk_req_level CHECK (required_level BETWEEN 1 AND 5)
        )
    `);

    console.log("✅ テーブル作成完了");
    console.log("   - skills");
    console.log("   - staff_skills");
    console.log("   - service_skill_requirements");
} finally {
    await conn.end();
}
