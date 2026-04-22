import type { Server } from "socket.io";
import { messageService } from "../services/messageService.js";

export const registerChatSocket = (io: Server) => {
    io.on("connection", (socket) => {// クライアントが接続したときに実行される socket = 「そのクライアント専用の通信口」
        socket.on("send_message", async ({ chatRelations }) => {// クライアントからこれが来る想定 → socket.emit("send_message", { chats }); socket.emit → その人だけに送信
            try {
                const saved = await messageService.createMessage(chatRelations);

                io.emit("receive_message", saved); // 接続している全クライアントに送信
            } catch (e) {
                console.error("[chatSocket] send_message error:", e);
                socket.emit("chat_error", { message: "error" }); //何か失敗したら 👉 送信した本人だけにエラー返す
            }
        })
    })
}