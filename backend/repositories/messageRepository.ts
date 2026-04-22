import type { RowDataPacket, ResultSetHeader } from "mysql2";
import type { Message } from "../../shared/types/MessageTypes.js";
import pool from "../config/db.js";

export const messageRepository = {
    async findAll() {
        const [rows] = await pool.execute<RowDataPacket[]>(
            `
            SELECT id, text, user_name, created_at
            FROM chats
            `
        );

        const chatRelation = rows.map((row) => ({
            id: row.id,
            text: row.text,
            userName: row.user_name,
            createdAt: row.created_at
        }));

        return chatRelation;
     },

    async create(chats: Message): Promise<Message> {
        const [result] = await pool.execute<ResultSetHeader>(
            `
            INSERT INTO chats (
                text, user_name
            ) VALUES (?, ?)
            `,
            [
                chats.text,
                chats.userName
            ]
        );

        if (result.affectedRows === 0) {
            throw new Error("正しくメッセージを登録できませんでした");
        }

        const [rows] = await pool.execute<RowDataPacket[]>(
            `SELECT id, text, user_name, created_at FROM chats WHERE id = ?`,
            [result.insertId]
        );

        const row = (rows as RowDataPacket[])[0];
        return {
            id: row?.id,
            text: row?.text,
            userName: row?.user_name,
            createdAt: row?.created_at
        };
    },
};

export type MessageRepository = typeof messageRepository;