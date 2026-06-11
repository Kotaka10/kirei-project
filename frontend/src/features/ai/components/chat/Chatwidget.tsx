import { useEffect, useState } from "react";
import { ChatWindow } from "./Chatwindow";
import { OPEN_AI_CHAT_EVENT, type OpenAiChatDetail } from "../../lib/chatWidgetEvents";

export function ChatWidget() {
    const [isOpen,       setIsOpen]       = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [queuedMessage, setQueuedMessage] = useState<string | null>(null);

    useEffect(() => {
        const handleOpenChat = (event: Event) => {
            const detail = (event as CustomEvent<OpenAiChatDetail>).detail;
            setQueuedMessage(detail?.message?.trim() || null);
            setIsOpen(true);
        };

        window.addEventListener(OPEN_AI_CHAT_EVENT, handleOpenChat);
        return () => window.removeEventListener(OPEN_AI_CHAT_EVENT, handleOpenChat);
    }, []);

    function handleClose() {
        setIsOpen(false);
        setIsFullscreen(false);
    }

    return (
        <>
            {/* 全画面時: viewport 全体を覆うコンテナ */}
            {isOpen && isFullscreen && (
                <div className="fixed inset-0 z-50">
                    <ChatWindow
                        onClose={handleClose}
                        isFullscreen={isFullscreen}
                        onToggleFullscreen={() => setIsFullscreen(false)}
                        queuedMessage={queuedMessage}
                        onQueuedMessageConsumed={() => setQueuedMessage(null)}
                    />
                </div>
            )}

            {/* 外側クリック吸収レイヤー: チャット本体(z-50)の一段下(z-40)に透明オーバーレイを敷き、
                画面外クリックを受け止めて「閉じるだけ」にする（下のリンク等へクリックを伝播させない） */}
            {isOpen && !isFullscreen && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={handleClose}
                    aria-hidden="true"
                />
            )}

            {/* 通常時: 右下固定のポップアップ */}
            <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
                {isOpen && !isFullscreen && (
                    <ChatWindow
                        onClose={handleClose}
                        isFullscreen={isFullscreen}
                        onToggleFullscreen={() => setIsFullscreen(true)}
                        queuedMessage={queuedMessage}
                        onQueuedMessageConsumed={() => setQueuedMessage(null)}
                    />
                )}

                {/* トグルボタン（全画面時は非表示） */}
                {!isFullscreen && (
                    <button
                        onClick={() => setIsOpen((prev) => !prev)}
                        aria-label={isOpen ? "チャットを閉じる" : "AIアシスタントを開く"}
                        className="
                            w-14 h-14 rounded-full bg-[#48bcb6] text-white shadow-lg
                            flex items-center justify-center
                            hover:opacity-90 active:scale-95
                            transition-all duration-200
                        "
                    >
                        {isOpen ? (
                            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                            </svg>
                        ) : (
                            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
                            </svg>
                        )}
                    </button>
                )}
            </div>
        </>
    );
}
