import type { Message } from "../../shared/types/MessageTypes.js";
import { messageRepository } from "../repositories/messageRepository.js";

export const messageService = {
    getMessages: () => {
        return messageRepository.findAll();
    },

    createMessage: async (chats: Message): Promise<Message> => {
        if (!chats) {
            throw new Error("メッセージ情報が見つかりませんでした");
        }

        return await messageRepository.create(chats);
    }
}

export type MessageService = typeof messageService;