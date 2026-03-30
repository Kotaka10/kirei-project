import pool from "../config/db.js";

type FileInfo = {
    fileName: string;
    storedFileName: string;
    storedPath: string;
    mimeType: string; // ファイルタイプ（image/pngなど）
    size: number;
}

export const fileRepository = { // fileRepositoryはオブジェクト　キー：insert（メソッド名） + 値：関数という形
    async insert(file: FileInfo) { // ↓この行から下記はキー：値の省略した形 insertという関数名がキー、関数自体が値に相当
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

        const [result] = await pool.query(sql, [ // pool.query() → DBに実行させている　sql = やりたいDB操作、　[値] ＝sqlにはいるデータ
            file.fileName,
            file.storedFileName,
            file.storedPath,
            file.mimeType,
            file.size,
        ]);

        return result;
    }
}