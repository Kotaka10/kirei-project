import { getConnection } from "./connection.js";

export async function initDocumentsTable(): Promise<void> {
    const conn = await getConnection();
    try {
        // FK なしで作成（依存テーブルの有無に左右されない）
        await conn.execute(`
            CREATE TABLE IF NOT EXISTS documents (
                id            INT           AUTO_INCREMENT PRIMARY KEY,
                document_type ENUM('estimate', 'work_report', 'invoice') NOT NULL,
                document_no   VARCHAR(50)   NOT NULL UNIQUE,
                title         VARCHAR(255)  NOT NULL,
                customer_name VARCHAR(255)  NOT NULL,
                booking_id    INT           NULL,
                estimate_id   INT           NULL,
                content_html  LONGTEXT      NOT NULL,
                total_amount  DECIMAL(12,0) NULL,
                issued_by     INT           NOT NULL,
                issued_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
                status        ENUM('draft','issued') DEFAULT 'draft',
                notes         TEXT          NULL,
                created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        `);
    } finally {
        await conn.end();
    }
}