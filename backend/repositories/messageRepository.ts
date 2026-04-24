import type { RowDataPacket, ResultSetHeader } from "mysql2";
import type { Message } from "../../shared/types/MessageTypes.js";
import pool from "../config/db.js";

export const messageRepository = {
    async findAll() {
        const [rows] = await pool.execute<RowDataPacket[]>(
            `SELECT id, senderUserId, receiverUserId, user_name, text, created_at FROM chats`
        );

        return rows.map((row) => ({
            id: row.id,
            senderUserId: row.senderUserId,
            receiverUserId: row.receiverUserId,
            userName: row.user_name,
            text: row.text,
            createdAt: row.created_at,
        }));
    },

    async create(chats: Message): Promise<Message> {
        const [result] = await pool.execute<ResultSetHeader>(
            `INSERT INTO chats (senderUserId, receiverUserId, user_name, text) VALUES (?, ?, ?, ?)`,
            [chats.senderUserId, chats.receiverUserId, chats.userName, chats.text]
        );

        if (result.affectedRows === 0) {
            throw new Error("正しくメッセージを登録できませんでした");
        }

        const [rows] = await pool.execute<RowDataPacket[]>(
            `SELECT id, senderUserId, receiverUserId, user_name, text, created_at FROM chats WHERE id = ?`,
            [result.insertId]
        );

        const row = (rows as RowDataPacket[])[0];
        if (!row) throw new Error("保存したメッセージが見つかりませんでした");

        return {
            id: row.id,
            senderUserId: row.senderUserId,
            receiverUserId: row.receiverUserId,
            userName: row.user_name,
            text: row.text,
            createdAt: row.created_at,
        };
    },
};

export type MessageRepository = typeof messageRepository;