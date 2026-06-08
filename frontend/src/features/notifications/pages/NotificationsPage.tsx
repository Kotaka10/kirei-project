import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useNotificationContext } from "../context/NotificationContext";
import { STATUS_LABEL, STATUS_COLOR } from "../../cases/types/caseTypes";

export default function NotificationsPage() {
    const navigate = useNavigate();
    const { notifications, loading, error, markRead, markAll } = useNotificationContext();
    const [selected, setSelected] = useState<number | null>(null);

    const handleClick = async (id: number, caseId: number, isRead: boolean) => {
        if (!isRead) await markRead(id);
        setSelected(id === selected ? null : id);
        void caseId;
    };

    const n = notifications.find(n => n.id === selected);

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-800">案件通知</h1>
                {notifications.some(n => !n.is_read) && (
                    <button
                        onClick={markAll}
                        className="text-sm text-blue-600 hover:underline"
                    >
                        すべて既読にする
                    </button>
                )}
            </div>

            {loading && (
                <div className="flex justify-center py-12">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
            )}

            {error && (
                <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm mb-4">{error}</div>
            )}

            {!loading && notifications.length === 0 && (
                <div className="text-center py-16 text-gray-400">
                    <p className="text-4xl mb-3">🔔</p>
                    <p>通知はありません</p>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* 通知リスト */}
                <div className="space-y-2">
                    {notifications.map(notif => (
                        <div
                            key={notif.id}
                            onClick={() => handleClick(notif.id, notif.case_id, notif.is_read)}
                            className={`p-4 rounded-xl border cursor-pointer transition-all
                                ${selected === notif.id
                                    ? "border-blue-400 bg-blue-50"
                                    : notif.is_read
                                        ? "border-gray-200 bg-white hover:bg-gray-50"
                                        : "border-blue-200 bg-white hover:bg-blue-50"
                                }`}
                        >
                            <div className="flex items-start gap-3">
                                {!notif.is_read && (
                                    <span className="mt-1.5 w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                                )}
                                {notif.is_read && <span className="mt-1.5 w-2 h-2 shrink-0" />}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        {notif.case_status && (
                                            <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-medium ${STATUS_COLOR[notif.case_status]}`}>
                                                {STATUS_LABEL[notif.case_status]}
                                            </span>
                                        )}
                                        <p className={`text-sm truncate ${notif.is_read ? "text-gray-600" : "font-semibold text-gray-800"}`}>
                                            {notif.case_title ?? "案件"}
                                        </p>
                                    </div>
                                    <p className="text-xs text-gray-400 line-clamp-1">{notif.case_summary}</p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        {new Date(notif.created_at).toLocaleString("ja-JP")}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* 詳細パネル */}
                <div>
                    {n ? (
                        <div className="bg-white border border-gray-200 rounded-xl p-5 sticky top-6">
                            <div className="flex items-center gap-2 mb-3">
                                {n.case_status && (
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[n.case_status]}`}>
                                        {STATUS_LABEL[n.case_status]}
                                    </span>
                                )}
                                <h2 className="font-semibold text-gray-800">{n.case_title}</h2>
                            </div>

                            <p className="text-sm text-gray-600 mb-4 leading-relaxed">{n.case_summary}</p>

                            {n.case_document && (
                                <div className="mb-4">
                                    <h3 className="text-xs font-semibold text-gray-500 mb-2">AI生成書類</h3>
                                    <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
                                        {n.case_document}
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={() => navigate(`/cases/${n.case_id}`)}
                                className="w-full py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
                            >
                                案件詳細を開く
                            </button>
                        </div>
                    ) : (
                        <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center text-gray-400">
                            <p className="text-sm">通知を選択すると詳細が表示されます</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}