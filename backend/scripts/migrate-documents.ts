import { getConnection } from "../db/connection.js";
import dotenv from "dotenv";
dotenv.config();

async function migrate() {
    const conn = await getConnection();
    try {
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
                status        ENUM('draft', 'issued') DEFAULT 'draft',
                notes         TEXT          NULL,
                created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (booking_id)  REFERENCES bookings(id)       ON DELETE SET NULL,
                FOREIGN KEY (estimate_id) REFERENCES visit_estimates(id) ON DELETE SET NULL,
                FOREIGN KEY (issued_by)   REFERENCES staffs(id)
            )
        `);
        console.log("✅ documents テーブルを作成しました");
    } finally {
        await conn.end();
    }
}

migrate().catch(console.error);
