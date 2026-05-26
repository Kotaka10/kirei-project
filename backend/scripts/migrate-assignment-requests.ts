import { getConnection } from "../db/connection.js";

async function migrate() {
    const conn = await getConnection();
    try {
        await conn.execute(`
            CREATE TABLE IF NOT EXISTS assignment_requests (
                id              INT AUTO_INCREMENT PRIMARY KEY,
                booking_id      INT NOT NULL,
                target_staff_id INT NOT NULL,
                requested_by    INT NOT NULL,
                status          ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
                note            VARCHAR(500),
                created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                approved_by     INT,
                approved_at     TIMESTAMP,
                FOREIGN KEY (booking_id)      REFERENCES bookings(id) ON DELETE CASCADE,
                FOREIGN KEY (target_staff_id) REFERENCES staffs(id),
                FOREIGN KEY (requested_by)    REFERENCES staffs(id),
                FOREIGN KEY (approved_by)     REFERENCES staffs(id)
            )
        `);
        console.log("✅ assignment_requests テーブルを作成しました");
    } finally {
        await conn.end();
    }
}

migrate().catch(console.error);
