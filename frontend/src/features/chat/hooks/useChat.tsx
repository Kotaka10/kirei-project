import { useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import type { Message } from "../../../../../shared/types/MessageTypes";
import { fetchMessages } from "../../services/messageApi";

export default function useChat() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [userName, setUserName] = useState("");
    const [text, setText] = useState("");
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        const init = async () => {
            try {
                const data = await fetchMessages();
                setMessages(data);
            } catch (err) {
                console.error(err);
            }
        };

        init();
    }, []);

    useEffect(() => {
        const socket = io("http://localhost:3000"); //サーバーに接続
        socketRef.current = socket; //他の場所でも使えるように保持（再レンダリングでも消えない）

        const handleReceiveMessage = (message: Message) => { //メッセージが来たら配列に追加
            setMessages((prev) => [...prev, message]);
        };

        const handleChatError = (error: { message: string }) => {//　サーバーのこれに対応 → socket.emit("chat_error", { message: "error" });
            alert(error.message);
        };

        socket.on("receive_message", handleReceiveMessage); //サーバーからのイベントを待ち受ける
        socket.on("chat_error", handleChatError);           //サーバーからのイベントを待ち受ける

        return () => {
            socket.off("receive_message", handleReceiveMessage); //socket.off(...) → イベントリスナーを削除
            socket.off("chat_error", handleChatError);
            socket.disconnect(); //サーバーとの接続を閉じる
        };
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        socketRef.current?.emit("send_message", {
            userName,
            text,
        });

        setText("");
    };

    return {
        messages,
        handleSubmit,
        userName,
        text,
        setUserName,
        setText,
    };
}
