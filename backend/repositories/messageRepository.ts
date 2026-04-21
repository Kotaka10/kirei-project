import type { Message } from "../../shared/types/MessageTypes.js";

const messages: Message[] = [];

export const messageRepository = {
    findAll(): Message[] { return messages; },

    create(userName: string, text: string): Message {
        const newMessage: Message = {
            id: crypto.randomUUID(), //一意（ユニーク）なIDを自動生成している
            userName,
            text,
            createdAt: new Date().toISOString(),
        };

        messages.push(newMessage);
        return newMessage;
    },
};

export type MessageRepository = typeof messageRepository;