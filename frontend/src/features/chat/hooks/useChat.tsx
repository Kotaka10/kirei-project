import { useEffect, useState } from "react";
import type { Message } from "../../../../../shared/types/MessageTypes";
import { fetchMessages } from "../../services/messageApi";
import { socket } from "../../services/socket";


export default function useChat() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [userName, setUserName] = useState("");
    const [text, setText] = useState("");

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
        const handleReceiveMessage = (message: Message) => {
            setMessages((prev) => [...prev, message]);
        };

        const handleChatError = (error: { message: string }) => {
            alert(error.message);
        };

        socket.on("receive_message", handleReceiveMessage);
        socket.on("chat_error", handleChatError);

        return () => {
            socket.off("receive_message", handleReceiveMessage);
            socket.off("chat_error", handleChatError);
        };
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        socket.emit("send_message", {
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