import { useCallback, useEffect, useRef, useState } from "react";
import { useChat } from "../../hooks/useChat";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";
import { ChatInput } from "./ChatInput";
import { SuggestedQuestions } from "./SuggestedQuestions";
import { DocumentPreviewModal } from "./DocumentPreviewModal";

interface Props {
    onClose:             () => void;
    isFullscreen:        boolean;
    onToggleFullscreen:  () => void;
}

export function ChatWindow({ onClose, isFullscreen, onToggleFullscreen }: Props) {
    const { messages, isLoading, error, sendMessage, clearHistory } = useChat();
    const bottomRef           = useRef<HTMLDivElement>(null);
    const scrollContainerRef  = useRef<HTMLDivElement>(null);
    const shouldAutoScrollRef = useRef(true);

    // 書類プレビューモーダルの表示パス（null のとき非表示）
    const [previewPath, setPreviewPath] = useState<string | null>(null);

    // スクロール位置を監視してフラグを更新
    const handleScroll = () => {
        const el = scrollContainerRef.current;
        if (!el) return;
        const { scrollTop, scrollHeight, clientHeight } = el;
        shouldAutoScrollRef.current = scrollHeight - scrollTop - clientHeight < 8;
    };

    // メッセージ追加・更新時、フラグが true のときだけ自動スクロール
    useEffect(() => {
        if (shouldAutoScrollRef.current) {
            bottomRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    // メッセージ送信時は常に最下部へ（スクロール位置をリセット）
    const handleSend = useCallback((content: string) => {
        shouldAutoScrollRef.current = true;
        sendMessage(content);
    }, [sendMessage]);

    const isEmpty = messages.length === 0;
    const lastMsg = messages.at(-1);
    const showTyping = isLoading && (!lastMsg || lastMsg.content === "");

    // 最後のアシスタントメッセージのインデックス（提案ボタン表示制御）
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
            <div className="flex items-center justify-between px-4 py-3 bg-red-600 text-white flex-shrink-0">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                        {/* svg = ベクター画像, viewBox = 左上 (0, 0) 幅 24 高さ 24, fill = 塗りつぶし色,　currentColor = 親要素の色に追従 */}
                        <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                            {/* 
                                d=drawing(描画命令), M=Move to, 20 2 = 座標(20, 2)へ移動, H4=Horizontal line(x = 4まで移動), c=curve, v=vertical, I4-4(l = line)線を引く
                                z = close path　全体として吹き出しっぽいチャットアイコン
                             */}
                            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
                        </svg>
                    </div>
                    <div>
                        {/* leading-tight = 行間を狭くする */}
                        <p className="text-sm font-semibold leading-tight">AIアシスタント</p>
                        <p className="text-[10px] text-red-100">スケジュール・売上げ・予約を確認</p>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    {messages.length > 0 && (
                        <button
                            onClick={clearHistory}
                            title="会話をリセット"
                            className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
                        >{/* transition-colors = 色の変化をアニメーションする。今回はホバーすると背景が少し白くなる */}
                            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                                <path d="
                                    M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z
                                "/>
                            </svg>
                        </button>
                    )}
                    {/* 全画面トグルボタン */}
                    <button
                        onClick={onToggleFullscreen}
                        title={isFullscreen ? "ウィンドウに戻す" : "全画面表示"}
                        className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
                    >
                        {isFullscreen ? (
                            /* 縮小アイコン */
                            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>
                            </svg>
                        ) : (
                            /* 拡大アイコン */
                            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
                            </svg>
                        )}
                    </button>
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

            {/* メッセージ一覧 */}
            <div ref={scrollContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                {isEmpty ? (
                    <div className="flex flex-col items-center justify-center h-full text-center gap-3">
                        <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
                            <svg className="w-7 h-7 text-red-500" viewBox="0 0 24 24" fill="currentColor">
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
                                        {msg.suggestions.map((s) => (
                                            <button
                                                key={s}
                                                onClick={() => handleSend(s)}
                                                className="text-[11px] px-3 py-1.5 rounded-full border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 transition-colors duration-150 whitespace-nowrap"
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

                {/* ローディング：最初のチャンク到達前のみ表示 */}
                {showTyping && <TypingIndicator />}

                {/* エラー表示 */}
                {error && (
                    <div className="flex justify-center">
                        <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3">
                            {error}
                        </p>
                    </div>
                )}

                <div ref={bottomRef} />
            </div>

            {/* サジェスト（初回のみ表示）*/}
            {isEmpty && (
                <SuggestedQuestions onSelect={handleSend} />
            )}

            {/* 入力フォーム */}
            <ChatInput onSend={handleSend} isLoading={isLoading} />

            {/* 書類プレビューモーダル */}
            {previewPath && (
                <DocumentPreviewModal
                    documentPath={previewPath}
                    onClose={() => setPreviewPath(null)}
                />
            )}
        </div>
    )
}