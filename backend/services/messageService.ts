import { messageRepository } from "../repositories/messageRepository.js";

export const messageService = {
    getMessages: () => {
        return messageRepository.findAll();
    },

    createMessage: (userName: string, text: string) => {
        if (!userName?.trim()) throw new Error("userNameが必要です");
        if (!text?.trim()) throw new Error("textが必要です");

        return messageRepository.create(userName, text);
    }
}

export type MessageService = typeof messageService;