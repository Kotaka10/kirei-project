import { Connection } from "mysql2/promise";
import { generateJSON } from "../db/openai";
import { Customer } from "../types";

export async function generateCustomers(conn: Connection, count = 30): Promise<void> {
    console.log("顧客データ生成中...");

    const data = await generateJSON<{ customers: Customer[] }> (
        `日本の清掃・メンテナンスサービスを利用する顧客のデータを${count}件生成してください。
        各データ:
        - name: 日本人フルネーム（漢字）
        - email: ビジネス or 個人メールアドレス
        - phone: 携帯番号（090 or 080始まり、ハイフンあり）
        - company: 会社名（個人の場合はnull）
        - prefecture: 都道府県（東京・大阪・神奈川・愛知・福岡が多め）
        - plan: "free" | "basic" | "pro"`,
        `ダミーデータ生成の専門家です。{"customers":[...]}の形式のJSONのみ返してください。`
    );

    const rows = data.customers.map((c) => [
        c.name,
        c.email,
        c.phone,
        c.company ?? null,
        c.prefecture,
        c.plan ?? "basic",
    ]);

    await conn.query(
        `INSERT IGNORE INTO customers
        (name, email, phone, company, prefecture, plan)
        VALUES ?`,
        [rows]
    );

    console.log(` ✔︎ customers: ${rows.length}件挿入`);
}