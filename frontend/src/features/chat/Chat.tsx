import { useState } from "react";
import useChat from "./hooks/useChat";
import useOneSignal from "../../one-signal/hooks/useOneSignal";

export default function Chat() {
    const { payload, setPayload, messageInfo, handleSubmit } = useChat();
    const { status, handleEnableNotifications } = useOneSignal();
    const [notifUserId, setNotifUserId] = useState("");

    return (
        <div className="mx-auto mt-10 max-w-xl rounded-2xl border p-6 shadow">
            <h1 className="mb-4 text-2xl font-bold">チャット</h1>

            <div className="mb-4 h-96 overflow-auto rounded-lg border p-4">
                {messageInfo.length === 0 ? (
                    <p className="text-sm text-gray-500">まだメッセージはありません</p>
                ) : (
                    <ul className="space-y-3">
                        {messageInfo.map((m) => (
                            <li key={m.id} className="rounded-lg bg-gray-100 p-3">
                                <p className="text-sm font-semibold">{m.userName}</p>
                                <p>{m.text}</p>
                                <p className="text-xs text-gray-500">
                                    {new Date(m.createdAt).toLocaleString()}
                                </p>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
                <input
                    type="text"
                    placeholder="名前"
                    value={payload.userName}
                    onChange={(e) => setPayload((prev) => ({ ...prev, userName: e.target.value }))}
                    className="w-full rounded-lg border px-3 py-2"
                />
                <div className="flex gap-2">
                    <input
                        type="number"
                        placeholder="自分のID（送信者）"
                        value={payload.senderUserId || ""}
                        onChange={(e) => setPayload((prev) => ({ ...prev, senderUserId: Number(e.target.value) }))}
                        className="w-full rounded-lg border px-3 py-2"
                    />
                    <input
                        type="number"
                        placeholder="相手のID（受信者）"
                        value={payload.receiverUserId || ""}
                        onChange={(e) => setPayload((prev) => ({ ...prev, receiverUserId: Number(e.target.value) }))}
                        className="w-full rounded-lg border px-3 py-2"
                    />
                </div>
                <input
                    type="text"
                    placeholder="メッセージ"
                    value={payload.text}
                    onChange={(e) => setPayload((prev) => ({ ...prev, text: e.target.value }))}
                    className="w-full rounded-lg border px-3 py-2"
                />
                <button
                    type="submit"
                    className="w-full rounded-lg bg-blue-600 px-4 py-2 text-white"
                >
                    送信
                </button>
            </form>

            {/* 通知設定 */}
            <div className="mt-6 pt-4 border-t">
                <p className="text-sm font-semibold text-gray-600 mb-2">通知設定</p>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={notifUserId}
                        onChange={(e) => setNotifUserId(e.target.value)}
                        placeholder="ユーザーID（例: 1）"
                        className="flex-1 rounded-lg border px-3 py-2 text-sm"
                    />
                    <button
                        type="button"
                        onClick={() => handleEnableNotifications(notifUserId.trim())}
                        disabled={!notifUserId.trim()}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm disabled:opacity-50"
                    >
                        通知を有効化
                    </button>
                </div>
                {status !== "未実行" && (
                    <p className="mt-2 text-xs text-gray-500 whitespace-pre-wrap">{status}</p>
                )}
            </div>
        </div>
    );
}
