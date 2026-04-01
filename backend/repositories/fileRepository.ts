import pool from "../config/db.js";
import type { FileInfoTypes } from "../../shared/types/FileInfoTypes.js";
import type { ResultSetHeader, RowDataPacket } from "mysql2";

export const fileRepository = { // fileRepositoryはオブジェクト　キー：insert（メソッド名） + 値：関数という形
    async insert(file: Omit<FileInfoTypes, 'id' | 'url'>) { // ↓この行から下記はキー：値の省略した形 insertという関数名がキー、関数自体が値に相当
        const sql = 
        `
        INSERT INTO files (
            file_name,
            stored_file_name,
            stored_path,
            mime_type,
            size
        ) VALUES (?, ?, ?, ?, ?)
        `;

        const [result] = await pool.query<ResultSetHeader>(sql, [ // pool.query() → DBに実行させている　sql = やりたいDB操作、　[値] ＝sqlに入るデータ
            file.fileName,
            file.storedFileName,
            file.storedPath,
            file.mimeType,
            file.size,
        ]);

        return  result.insertId;
    },

    async findAllFiles() {
        const sql = 
        `
        SELECT
            id,
            file_name AS fileName,
            stored_file_name AS storedFileName,
            stored_path AS storedPath,
            mime_type AS mimeType,
            size
        FROM files
        ORDER BY id DESC
        `
        const [rows] = await pool.query<RowDataPacket[]>(sql);
        return rows;
    }
}

