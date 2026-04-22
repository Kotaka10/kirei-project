import type { Message } from "../../shared/types/MessageTypes.js";
import { messageRepository } from "../repositories/messageRepository.js";

export const messageService = {
    getMessages: () => {
        return messageRepository.findAll();
    },

    createMessage: async (chats: Message) => {
        if (!chats) {
            throw new Error("メッセージ情報が見つかりませんでした");
        }

        const result = await messageRepository.create(chats);

        if (result.affectedRows === 0) {
            throw new Error("正しくメッセージを登録できませんでした");
        }

        return result;
    }
}

export type MessageService = typeof messageService;