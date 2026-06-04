import { getConnection } from "../db/connection.js";

async function migrate() {
    const conn = await getConnection();
    try {
        await conn.execute(`
            CREATE TABLE IF NOT EXISTS chat_sessions (
                id         INT AUTO_INCREMENT PRIMARY KEY,
                staff_id   INT NOT NULL,
                title      VARCHAR(100) NOT NULL DEFAULT '新しいチャット',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (staff_id) REFERENCES staffs(id) ON DELETE CASCADE
            )
        `);
        console.log("✅ chat_sessions テーブルを作成しました");

        await conn.execute(`
            CREATE TABLE IF NOT EXISTS chat_messages (
                id         INT AUTO_INCREMENT PRIMARY KEY,
                session_id INT NOT NULL,
                role       ENUM('user', 'assistant') NOT NULL,
                content    TEXT NOT NULL,
                suggestions JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
            )
        `);
        console.log("✅ chat_messages テーブルを作成しました");
    } finally {
        await conn.end();
    }
}

migrate().catch(console.error);