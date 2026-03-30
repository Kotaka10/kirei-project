import mysql from 'mysql2/promise';

const pool = mysql.createPool({
    host: "db",
    user: "root",
    password: process.env.DB_PASSWORD || "",
    database: "kirei_db",
    waitForConnections: true,
});

export default pool;