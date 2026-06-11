import { useCallback, useEffect, useRef, useState } from "react";
import { useChat } from "../../hooks/useChat";
import { useChatSessions } from "../../hooks/useChatSessions";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";
import { ChatInput } from "./ChatInput";
import { SuggestedQuestions } from "../suggestions/SuggestedQuestions";
import { DocumentPreviewModal } from "./DocumentPreviewModal";
import { ChatHistory } from "./ChatHistory";
import { useSuggestedQuestions } from "../../hooks/useSuggestedQuestions";

interface Props {
    onClose:            () => void;
    isFullscreen:       boolean;
    onToggleFullscreen: () => void;
    queuedMessage?:     string | null;
    onQueuedMessageConsumed?: () => void;
}

type ViewMode = "chat" | "history";

export function ChatWindow({ onClose, isFullscreen, onToggleFullscreen, queuedMessage, onQueuedMessageConsumed }: Props) {
    const [viewMode,         setViewMode]         = useState<ViewMode>("chat");
    const [activeSessionId,  setActiveSessionId]  = useState<number | null>(null);
    const [previewPath,      setPreviewPath]       = useState<string | null>(null);
    const [pendingMessage,   setPendingMessage]    = useState<string | null>(null);

    const bottomRef          = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const shouldAutoScrollRef = useRef(true);

    const { sessions, isLoading: sessionsLoading, loadSessions, upsertSession, rename, remove } = useChatSessions();

    // 新規セッションが作られたとき: リスト更新 + アクティブに設定
    const handleSessionCreated = useCallback((sessionId: number) => {
        setActiveSessionId(sessionId);
        loadSessions(); // DB から最新の title 込みで取得
    }, [loadSessions]);

    const { messages, isLoading, error, sendMessage } = useChat({
        activeSessionId,
        onSessionCreated: handleSessionCreated,
    });

    useEffect(() => {
        const message = queuedMessage?.trim();
        if (!message || isLoading) return;

        shouldAutoScrollRef.current = true;
        setActiveSessionId(null);
        setViewMode("chat");
        setPendingMessage(message);
        onQueuedMessageConsumed?.();
    }, [queuedMessage, isLoading, onQueuedMessageConsumed]);

    useEffect(() => {
        if (!pendingMessage || activeSessionId !== null || isLoading) return;
        sendMessage(pendingMessage);
        setPendingMessage(null);
    }, [activeSessionId, isLoading, pendingMessage, sendMessage]);

    // スクロール制御
    const handleScroll = () => {
        const el = scrollContainerRef.current; //メッセージ一覧の<div>要素そのもの　スクロール位置などの情報もっている
        if (!el) return;
        const { scrollTop, scrollHeight, clientHeight } = el;
        shouldAutoScrollRef.current = scrollHeight - scrollTop - clientHeight < 8;
    };

    useEffect(() => {
        if (shouldAutoScrollRef.current) {
            bottomRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    // メッセージ送信時は常に最下部へ
    const handleSend = useCallback((content: string) => {
        shouldAutoScrollRef.current = true;
        sendMessage(content);
    }, [sendMessage]);

    // 履歴パネルを開く
    const handleOpenHistory = useCallback(() => {
        loadSessions();
        setViewMode("history");
    }, [loadSessions]);

    // セッション選択
    const handleSelectSession = useCallback((id: number) => {
        setActiveSessionId(id);
        setViewMode("chat");
    }, []);

    // 新規チャット
    const handleNewChat = useCallback(() => {
        setActiveSessionId(null);
        setViewMode("chat");
    }, []);

    const isEmpty          = messages.length === 0;
    const { questions: suggestedQuestions, isLoading: suggestionsLoading } = useSuggestedQuestions(
        viewMode === "chat" && isEmpty,
    );
    const lastMsg          = messages.at(-1);
    const showTyping       = isLoading && (!lastMsg || lastMsg.content === "");
    const lastAssistantIdx = messages.reduceRight(
        (acc, msg, idx) => (acc === -1 && msg.role === "assistant" ? idx : acc),
        -1,
    );

    const windowClass = isFullscreen
        ? "flex flex-col w-full h-full bg-gray-50 shadow-2xl border border-gray-200 overflow-hidden"
        : "flex flex-col w-[520px] h-[700px] bg-gray-50 rounded-2xl shadow-2xl border border-gray-200 overflow-hidden";

    return (
        <div className={windowClass}>
            {/* ヘッダー */}
            <div className="flex items-center justify-between px-4 py-3 bg-[#48bcb6] text-white flex-shrink-0">
                <div className="flex items-center gap-2.5">
                    {viewMode === "history" ? (
                        // 履歴表示中: 戻るボタン
                        <button
                            onClick={() => setViewMode("chat")}
                            className="p-1 rounded-lg hover:bg-white/20 transition-colors"
                            title="チャットに戻る"
                        >
                            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
                            </svg>
                        </button>
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
                            </svg>
                        </div>
                    )}
                    <div>
                        <p className="text-sm font-semibold leading-tight">
                            {viewMode === "history" ? "チャット履歴" : "AIアシスタント"}
                        </p>
                        <p className="text-[10px] text-white/80">
                            {viewMode === "history" ? "過去の会話を選択" : "スケジュール・売上げ・予約を確認"}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    {/* 履歴ボタン（チャット表示中のみ） */}
                    {viewMode === "chat" && (
                        <button
                            onClick={handleOpenHistory}
                            title="チャット履歴"
                            className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
                        >
                            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M13 3a9 9 0 00-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.95-2.05L6.64 18.36A8.955 8.955 0 0013 21a9 9 0 000-18zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/>
                            </svg>
                        </button>
                    )}

                    {/* 新規チャットボタン（チャット表示中 + メッセージありのとき） */}
                    {viewMode === "chat" && messages.length > 0 && (
                        <button
                            onClick={handleNewChat}
                            title="新しいチャット"
                            className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
                        >
                            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19 13H13v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                            </svg>
                        </button>
                    )}

                    {/* 全画面トグル */}
                    <button
                        onClick={onToggleFullscreen}
                        title={isFullscreen ? "ウィンドウに戻す" : "全画面表示"}
                        className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
                    >
                        {isFullscreen ? (
                            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>
                            </svg>
                        ) : (
                            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
                            </svg>
                        )}
                    </button>

                    {/* 閉じるボタン */}
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
                    >
                        <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                        </svg>
                    </button>
                </div>
            </div>

            {/* ─── 履歴パネル ─── */}
            {viewMode === "history" && (
                <ChatHistory
                    sessions={sessions}
                    isLoading={sessionsLoading}
                    activeSessionId={activeSessionId}
                    onSelectSession={handleSelectSession}
                    onNewChat={handleNewChat}
                    onRename={async (id, title) => { await rename(id, title); upsertSession({ ...sessions.find(s => s.id === id)!, title }); }}
                    onDelete={remove}
                />
            )}

            {/* ─── チャット本体 ─── */}
            {viewMode === "chat" && (
                <>
                    {/* メッセージ一覧 */}
                    <div ref={scrollContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                        {isEmpty ? (
                            <div className="flex flex-col items-center justify-center h-full text-center gap-3">
                                <div className="w-14 h-14 rounded-full bg-[#e8fbf8] flex items-center justify-center">
                                    <svg className="w-7 h-7 text-[#48bcb6]" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-700">何でもお気軽に</p>
                                    <p className="text-xs text-gray-400 mt-0.5">スケジュール・売上げ・予約を確認できます</p>
                                </div>
                            </div>
                        ) : (
                            messages.map((msg, idx) =>
                                msg.content ? (
                                    <div key={msg.id}>
                                        <MessageBubble
                                            message={msg}
                                            onDocumentClick={setPreviewPath}
                                        />
                                        {msg.role === "assistant" &&
                                         idx === lastAssistantIdx &&
                                         !isLoading &&
                                         msg.suggestions && msg.suggestions.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5 mt-2 ml-10">
                                                {msg.suggestions.map(s => (
                                                    <button
                                                        key={s}
                                                        onClick={() => handleSend(s)}
                                                        className="text-[11px] px-3 py-1.5 rounded-full border border-[#48bcb6] text-[#48bcb6] bg-[#e8fbf8] hover:opacity-90 transition-opacity duration-150 whitespace-nowrap"
                                                    >
                                                        {s}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ) : null
                            )
                        )}

                        {showTyping && <TypingIndicator />}

                        {error && (
                            <div className="flex justify-center">
                                <p className="text-xs text-[#48bcb6] bg-[#e8fbf8] border border-[#48bcb6] rounded-lg px-3 py-1">
                                    {error}
                                </p>
                            </div>
                        )}

                        <div ref={bottomRef} />
                    </div>

                    {isEmpty && (
                        <SuggestedQuestions
                            questions={suggestedQuestions}
                            isLoading={suggestionsLoading}
                            onSelect={handleSend}
                        />
                    )}

                    <ChatInput onSend={handleSend} isLoading={isLoading} />
                </>
            )}

            {/* 書類プレビューモーダル */}
            {previewPath && (
                <DocumentPreviewModal
                    documentPath={previewPath}
                    onClose={() => setPreviewPath(null)}
                />
            )}
        </div>
    );
}
