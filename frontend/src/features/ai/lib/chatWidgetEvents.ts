export const OPEN_AI_CHAT_EVENT = "ai-chat:open";

export interface OpenAiChatDetail {
    message?: string;
}

export function openAiChat(message?: string) {
    window.dispatchEvent(new CustomEvent<OpenAiChatDetail>(OPEN_AI_CHAT_EVENT, {
        detail: { message },
    }));
}
