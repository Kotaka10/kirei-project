import useChat from "./hooks/useChat";

export default function Chat() {
    const {
        chatRelations,
        setChatRelations,
        messageInfo,
        handleSubmit,
    } = useChat();

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
                    value={chatRelations.userName}
                    onChange={(e) => setChatRelations((prev) => ({ ...prev, userName: e.target.value}))}
                    className="w-full rounded-lg border px-3 py-2"
                />
                <input
                    type="text"
                    placeholder="メッセージ"
                    value={chatRelations.text}
                    onChange={(e) => setChatRelations((prev) => ({ ...prev, text: e.target.value }))}
                    className="w-full rounded-lg border px-3 py-2"
                />
                <button
                    type="submit"
                    className="w-full rounded-lg bg-blue-600 px-4 py-2 text-white"
                >
                    送信
                </button>
            </form>
        </div>
    )
}