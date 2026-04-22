import type { RowDataPacket, ResultSetHeader } from "mysql2";
import type { Message } from "../../shared/types/MessageTypes.js";
import pool from "../config/db.js";

const messages: Message[] = [];

export const messageRepository = {
    async findAll() { 
        const [rows] = await pool.execute<RowDataPacket[]>(
            `
            SELECT id, text, user_name
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

    async create(chats: Message) {
        const [result] = await pool.execute<ResultSetHeader>(
            `
            INSERT INTO chats (
                id, text, user_name
            ) VALUES (?, ?, ?)
            `,
            [
                chats.id,
                chats.text,
                chats.userName
            ]
        );

        return result;
    },
};

export type MessageRepository = typeof messageRepository;