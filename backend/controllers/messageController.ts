import type { Request, Response } from "express";
import type { MessageService } from "../services/messageService.js";

export const createMessageController = (service: MessageService) => {
    return {
        getMessages: (req: Request, res: Response) => {
            res.json(service.getMessages);
        },

        createMessages: (req: Request, res: Response) => {
            const result = service.createMessage(req.body);
            res.json(result);
        }
    }
}

export type MessageController = ReturnType<typeof createMessageController>;