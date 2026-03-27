import type { ResultSetHeader } from "mysql2";
import mysql from "mysql2/promise";
import type { UserInfoTypes } from "../../shared/types/UserInfoTypes.js";

const pool = mysql.createPool({
    host: "db",
    user: "root",
    password: process.env.DB_PASSWORD || "",
    database: "kirei_db",
    waitForConnections: true,
    connectionLimit: 10,
})

export const createUser = async (user: UserInfoTypes) => {
    const [result] = await pool.query<ResultSetHeader>(
        `
            INSERT INTO users (
                name,
                phone_number,
                zipcode,
                prefecture,
                city,
                other_address,
                building_name,
                publication_date,
                expiration_date,
                notes,
                memo
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            user.name,
            user.phoneNumber,
            user.zipcode,
            user.prefecture,
            user.city,
            user.otherAddress,
            user.buildingName,
            user.publicationDate || null,
            user.expirationDate || null,
            user.notes,
            user.memo
        ]
    );

    return result.insertId;
}