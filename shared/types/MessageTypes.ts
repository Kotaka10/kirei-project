export type Message = {
    id: number,
    senderUserId: number;
    receiverUserId: number;
    userName: string;
    text: string;
    createdAt: string;
};