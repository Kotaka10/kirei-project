import bcrypt from "bcrypt";
import { getConnection } from "../db/connection.js";
import dotenv from "dotenv";
dotenv.config();

const ADMIN = {
    name:     "関カンタ",
    email:    "s.kanta@example.com",
    password: "password123",
    role:     "supervisor" as const,
};

async function main() {
    const conn = await getConnection();
    try {
        const passwordHash = await bcrypt.hash(ADMIN.password, 10);

        await conn.query(
            `INSERT INTO staffs (name, role, email, password_hash, is_active)
             VALUES (?, ?, ?, ?, true)
             ON DUPLICATE KEY UPDATE
               name          = VALUES(name),
               role          = VALUES(role),
               password_hash = VALUES(password_hash),
               is_active     = true`,
            [ADMIN.name, ADMIN.role, ADMIN.email, passwordHash]
        );

        console.log("✅ 管理者アカウントを登録しました");
        console.log(`   名前    : ${ADMIN.name}`);
        console.log(`   メール  : ${ADMIN.email}`);
        console.log(`   役職    : ${ADMIN.role}`);
        console.log(`   パスワード: ${ADMIN.password}  ← ログイン後に変更してください`);
    } finally {
        await conn.end();
    }
}

main().catch((err) => {
    console.error("❌ 登録に失敗しました:", err.message);
    process.exit(1);
});
