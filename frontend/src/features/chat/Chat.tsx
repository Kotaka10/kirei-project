import { useState } from "react";
import useChat from "./hooks/useChat";
import useOneSignal from "../../one-signal/hooks/useOneSignal";
import { useAuth } from "../auth/context/AuthContext";

const inputCls = "w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-colors";

export default function Chat() {
    const { payload, setPayload, messageInfo, handleSubmit } = useChat();
    const { status, handleEnableNotifications } = useOneSignal();
    const { user } = useAuth();
    const [notifUserId, setNotifUserId] = useState("");
    const isSupervisor = user?.role === "supervisor";

    return (
        <div className="bg-gray-50 min-h-screen p-6">
            <div className="max-w-xl mx-auto">
                <h1 className="text-xl font-bold text-gray-800 pl-3 border-l-4 border-blue-400 mb-5">
                    チャット
                </h1>

                {/* 送信フォーム + メッセージ一覧 */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-5">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                        メッセージを送る
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-3">
                        <input
                            type="text"
                            placeholder="名前"
                            value={payload.userName}
                            onChange={(e) => setPayload((prev) => ({ ...prev, userName: e.target.value }))}
                            className={inputCls}
                        />
                        <div className="flex gap-2">
                            <input
                                type="number"
                                placeholder="自分のID（送信者）"
                                value={payload.senderUserId || ""}
                                onChange={(e) => setPayload((prev) => ({ ...prev, senderUserId: Number(e.target.value) }))}
                                className={inputCls}
                            />
                            <input
                                type="number"
                                placeholder="相手のID（受信者）"
                                value={payload.receiverUserId || ""}
                                onChange={(e) => setPayload((prev) => ({ ...prev, receiverUserId: Number(e.target.value) }))}
                                className={inputCls}
                            />
                        </div>
                        <input
                            type="text"
                            placeholder="メッセージ"
                            value={payload.text}
                            onChange={(e) => setPayload((prev) => ({ ...prev, text: e.target.value }))}
                            className={inputCls}
                        />
                        <button
                            type="submit"
                            className="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
                        >
                            送信する
                        </button>
                    </form>

                    <div className="flex items-center gap-3 mt-5 mb-3">
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">メッセージ一覧</span>
                        <div className="h-px flex-1 bg-gray-100" />
                    </div>

                    <div className="h-72 overflow-auto rounded-xl border border-gray-200 bg-gray-50 p-3">
                        {messageInfo.length === 0 ? (
                            <p className="text-center text-sm text-gray-400 mt-8">まだメッセージはありません</p>
                        ) : (
                            <ul className="space-y-2">
                                {messageInfo.map((m) => (
                                    <li key={m.id} className="rounded-lg bg-white border border-gray-100 p-3 shadow-sm">
                                        <p className="text-sm font-semibold text-gray-700">{m.userName}</p>
                                        <p className="text-sm text-gray-800 mt-0.5">{m.text}</p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            {new Date(m.createdAt).toLocaleString()}
                                        </p>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                {/* 通知設定（管理者のみ） */}
                {isSupervisor &&
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                            通知設定
                        </p>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={notifUserId}
                                onChange={(e) => setNotifUserId(e.target.value)}
                                placeholder="ユーザーID（例: 1）"
                                className={inputCls}
                            />
                            <button
                                type="button"
                                onClick={() => handleEnableNotifications(notifUserId.trim())}
                                disabled={!notifUserId.trim()}
                                className="flex-shrink-0 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
                            >
                                通知を有効化
                            </button>
                        </div>
                        {status !== "未実行" && (
                            <p className="mt-3 text-xs text-gray-500 whitespace-pre-wrap">{status}</p>
                        )}
                    </div>
                }
            </div>
        </div>
    );
}
