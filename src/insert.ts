import mysql from "mysql2/promise"; //promiseがあることでawait/async対応
import { CompanyInfoTypes } from "../shared/types/CompanyInfoTypes";
import dotenv from "dotenv";

dotenv.config(); //.env ファイルから環境変数を読み込むための処理

export async function insertCustomers(customers: CompanyInfoTypes[]) {
    const conn = await mysql.createConnection({
        host:     process.env.DB_HOST,
        user:     process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
    });

    if (customers.length === 0) {
        console.log("挿入するデータがありません");
        await conn.end();
        return;
    }

    const values = customers.map(c => [
        c.id, c.companyName, c.zipcode, c.prefecture, c.city, c.otherAddress, c.buildingName, c.phoneNumber, JSON.stringify(c.emails), c.contractDate, c.status, c.cancellationDate
    ]);

    const placeholders = values.map(() => "(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").join(", ");
    const flatValues = values.flat();

    const [result] = await conn.query(
        `INSERT IGNORE INTO companies
         (id, company_name, zipcode, prefecture, city, other_address, building_name, phone_number, emails, contract_date, status, cancellation_date)
         VALUES ${placeholders}`,
         flatValues
    );

    await conn.end();
    console.log(`✔︎ ${(result as any).affectedRows} 件挿入しました`);
}