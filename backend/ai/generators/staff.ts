import { Connection } from "mysql2/promise";
import bcrypt from "bcrypt";
import { generateJSON } from "../db/openai.js";
import type { Staff } from "../types/indexTypes.js";

interface StaffWithEmail extends Staff {
    email: string;
}

export async function generateStaff(conn: Connection, count = 10): Promise<void> {
    console.log("スタッフデータ生成中...");

    const data = await generateJSON<{ staff: StaffWithEmail[] }>(
        `日本の清掃・メンテナンス会社のスタッフデータを${count}件生成してください。
        各データ:
        - name: 日本人フルネーム（漢字）
        - role: "cleaner" | "technician" | "supervisor"
        - email: 会社のメールアドレス（例: yamada@kirei.co.jp）
        - is_active: true`,
        `ダミーデータ生成の専門家です。{"staff":[...]}の形式のJSONのみ返してください。`
    );

    const defaultHash = await bcrypt.hash("password123", 10);

    const rows = data.staff.map(s => [
        s.name,
        s.role,
        s.email,
        defaultHash,
        s.is_active ?? true,
    ]);

    await conn.query(
        `INSERT IGNORE INTO staffs (name, role, email, password_hash, is_active)
        VALUES ?`,
        [rows]
    );

    console.log(` ✔︎ staffs: ${rows.length}件挿入`);
}
