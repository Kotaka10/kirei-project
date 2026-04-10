import type { Server } from "socket.io";
import { messageService } from "../services/messageService.js";

export const registerChatSocket = (io: Server) => {
    io.on("connection", (socket) => {
        socket.on("send_message", ({ userName, text }) => {
            try {
                const saved = messageService.createMessage(userName, text);

                io.emit("receive_message", saved);
            } catch (e) {
                socket.emit("chat_error", { message: "error" });
            }
        })
    })
}