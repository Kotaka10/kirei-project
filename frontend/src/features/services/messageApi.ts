import type { Message } from "../../../../shared/types/MessageTypes";

export const fetchMessages = async (): Promise<Message[]> => {
    const res = await fetch("http://localhost:3000/api/messages");

    if (!res.ok) {
        throw new Error("メッセージ取得に失敗しました");
    }

    return res.json();
}