import type { ResultSetHeader, RowDataPacket } from "mysql2";
import pool from "../config/db.js";

export const registerFileByBlob = async (file: Express.Multer.File) => {
    const [result] = await pool.execute(
        `
        INSERT INTO uploaded_files (
            filename,
            mimetype,
            size,
            data
        ) VALUES (?, ?, ?, ?)
        `,
        [
            file.originalname,
            file.mimetype,
            file.size,
            file.buffer
        ]
    );

    const id = (result as ResultSetHeader).insertId;

    const [rows] = await pool.execute<RowDataPacket[]>(
        `
        SELECT id, filename, mimetype, size, created_at
        FROM uploaded_files
        WHERE id = ?
        `,
        [id]
    );

    return { rows };
};

export const findFileById = async (id: number) => {
    const [rows] = await pool.execute(
        `
        SELECT id, filename, mimetype, data
        FROM uploaded_files
        WHERE id = ?
        `,
        [id]
    );

    const files = rows as Array<{
        id: number;
        filename: string;
        mimetype: string;
        data: Buffer;
    }>;

    return files[0];
}