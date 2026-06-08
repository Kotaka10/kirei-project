import mysql from "mysql2/promise";
import dotenv from "dotenv";
import { wrapConnectionForAudit } from "../audit/dbAudit.js";

dotenv.config();

export async function getConnection(): Promise<mysql.Connection> {
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST ?? "localhost",
        user: process.env.DB_USER ?? "root",
        password: process.env.DB_PASSWORD ?? "",
        database: process.env.DB_NAME ?? "kirei_db",
    });
    return wrapConnectionForAudit(conn);
}
