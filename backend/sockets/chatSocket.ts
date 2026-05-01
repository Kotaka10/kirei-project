import type { Server } from "socket.io";
import { messageService } from "../services/messageService.js";
import { sendPushToUser } from "../services/notificationService.js";

export const registerChatSocket = (io: Server) => {
    /* 
    io.on("connection", (socket) => {
        socket.on("send_message", async ({ chatRelations }) => {
            try {
                const saved = await messageService.createMessage(chatRelations);

                io.emit("receive_message", saved);
            } catch (e) {
                console.error("[chatSocket] send_message error:", e);
                socket.emit("chat_error", { message: "error" }); 
            }
        })
    })
     */
    io.on("connection", (socket) => { //クライアントが接続したときに実行される socket = 「そのクライアント専用の通信口」　const socket = io("http://localhost:3000")　←これにより接続発生
        socket.on("send_message", async (payload) => { //クライアントからこれが来る想定 → socket.emit("send_message", {...}); socket.emit → その人だけに送信
            try {
                const { userName, text, senderUserId, receiverUserId } = payload;
                const saved = await messageService.createMessage(payload);

                io.emit("receive_message", saved); //接続している全クライアントに送信
            
                if (senderUserId !== receiverUserId) { //自分自身には送らない
                    try {

                        const pushResult = await sendPushToUser({ //特定のユーザーに通知送信
                            externalId: `user-${Number(receiverUserId)}`,
                            title: "新着メッセージ",
                            body: `${userName}: ${text}`,
                        })
                    } catch (pushErr) {
                        console.error("[chat_socket] push notification error", pushErr);
                    }
                }
            } catch (err) {
                console.error("[chat_socket] send_message error:", err);
                socket.emit("chat_error", {message: "メッセージ送信に失敗しました"}); //何か失敗したら 👉 送信した本人だけにエラー返す
            }
        });
    });
}