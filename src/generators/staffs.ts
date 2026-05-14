import { Connection } from "mysql2/promise";
import { generateJSON } from "../db/openai";
import { Staff } from "../types";

export async function generateStaffs(conn: Connection): Promise<void> {
    console.log("スタッフデータ生成中...");

    const data = generateJSON<{ staffs: Staff[] }>(
        `ダミーデータ生成の専門家です。{"staffs":[...]}の形式のJSONを返してください`,
        `清掃・メンテナンスか会社のスタッフ10名のダミーデータを生成してください。
        各データ:
        - name: 日本人フルネーム（漢字）
        - role: "cleaner"（清掃員） | "technician"（技術者） | "supervisor"（管理者）
        - is_active: true or false（9名はtrue, 1名はfalse）`
    );

    const rows = (await data).staffs.map((s) => [
        s.name,
        s.role,
        s.is_active ?? true,
    ]);

    await conn.query(
        `INSERT INTO staffs (name, role, is_active)
        VALUES ?`,
        [rows]
    );

    console.log(` ✔︎ staffs: ${rows.length}件挿入`);
}