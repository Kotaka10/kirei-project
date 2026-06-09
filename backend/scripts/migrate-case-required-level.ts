/**
 * cases テーブルに required_level 列を追加するマイグレーション
 *   案件の内容からAIが自動判別した難易度レベル(1〜5)を保持する。
 *   このレベルとスタッフの保有スキルレベルを突き合わせ、
 *   「レベル感に適した」スタッフへ案件通知を送るために使用する。
 *
 *   1:見習い 2:初級 3:中級 4:上級 5:エキスパート
 */
import { getConnection } from "../db/connection.js";
import type { RowDataPacket } from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const conn = await getConnection();

try {
    // MySQL 8.0 は ADD COLUMN IF NOT EXISTS 未対応のため、存在チェックしてから追加する
    const [cols] = await conn.query<RowDataPacket[]>(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME   = 'cases'
           AND COLUMN_NAME  = 'required_level'`
    );

    if (cols.length === 0) {
        await conn.query(
            `ALTER TABLE cases
               ADD COLUMN required_level TINYINT NULL DEFAULT NULL
               COMMENT '案件の難易度レベル 1:見習い 2:初級 3:中級 4:上級 5:エキスパート'
               AFTER required_roles`
        );
        console.log("✅ cases.required_level を追加しました");
    } else {
        console.log("ℹ️ cases.required_level は既に存在します（スキップ）");
    }
} finally {
    await conn.end();
}
