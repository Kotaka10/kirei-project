import mysql from 'mysql2/promise';
import { wrapPoolForAudit } from '../audit/dbAudit.js';

const pool = mysql.createPool({ // プール：DBの接続管理をする箱
    host: "db",
    user: "root",
    password: process.env.DB_PASSWORD || "",
    database: "kirei_db",
    waitForConnections: true,
    charset: "utf8mb4",
});

export default wrapPoolForAudit(pool);
