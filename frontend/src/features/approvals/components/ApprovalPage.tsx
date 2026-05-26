import { useState } from "react";
import { useAuth } from "../../auth/context/AuthContext";
import { useApprovals } from "../hooks/useApprovals";

const STATUS_LABELS = { pending: "承認待ち", approved: "承認済み", rejected: "却下" } as const;
const STATUS_COLORS = {
    pending:  "bg-yellow-100 text-yellow-700",
    approved: "bg-green-100  text-green-700",
    rejected: "bg-red-100    text-red-600",
};

export default function ApprovalPage() {
    const { user } = useAuth();
    const [filter,      setFilter]      = useState<"" | "pending" | "approved" | "rejected">("");
    const [processingId, setProcessingId] = useState<number | null>(null);

    const { requests, loading, error, approve, reject } = useApprovals(filter || undefined);

    if (user?.role !== "supervisor") {
        return <div className="p-6 text-gray-500">このページは管理者のみ閲覧できます</div>;
    }

    const handle = async (id: number, action: "approve" | "reject") => {
        setProcessingId(id);
        try {
            if (action === "approve") await approve(id);
            else                      await reject(id);
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div className="p-6 max-w-3xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800">スタッフ割り振り承認</h1>
                <p className="text-sm text-gray-500 mt-1">リクエストを確認して承認または却下してください</p>
            </div>

            <div className="flex gap-2 mb-5">
                {(["", "pending", "approved", "rejected"] as const).map(s => (
                    <button
                        key={s}
                        onClick={() => setFilter(s)}
                        className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                            filter === s
                                ? "bg-gray-800 text-white border-gray-800"
                                : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                        }`}
                    >
                        {s === "" ? "すべて" : STATUS_LABELS[s]}
                    </button>
                ))}
            </div>

            {loading && <p className="text-gray-400 text-sm">読み込み中…</p>}
            {error   && <p className="text-red-500 text-sm">エラー: {error}</p>}

            {!loading && !error && requests.length === 0 && (
                <p className="text-gray-400 text-sm italic">リクエストはありません</p>
            )}

            <div className="flex flex-col gap-3">
                {requests.map(req => (
                    <div key={req.id} className="border rounded-xl p-4 bg-white shadow-sm">
                        <div className="flex items-start justify-between mb-2">
                            <div>
                                <span className="font-semibold text-gray-800">{req.service_type}</span>
                                <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[req.status]}`}>
                                    {STATUS_LABELS[req.status]}
                                </span>
                            </div>
                            <span className="text-xs text-gray-400">
                                {new Date(req.created_at).toLocaleDateString("ja-JP")}
                            </span>
                        </div>

                        <p className="text-sm text-gray-600 mb-1">
                            顧客: <span className="font-medium">{req.customer_name}</span>
                            ／ 日時: {new Date(req.scheduled_at).toLocaleDateString("ja-JP")}
                        </p>
                        <p className="text-sm text-gray-600 mb-1">
                            追加対象: <span className="font-medium text-blue-700">{req.target_staff_name}</span>
                        </p>
                        <p className="text-sm text-gray-600 mb-1">
                            申請者: {req.requested_by_name}
                        </p>
                        {req.note && (
                            <p className="text-sm text-gray-500 italic mb-1">「{req.note}」</p>
                        )}
                        {req.approved_by_name && (
                            <p className="text-xs text-gray-400">
                                処理者: {req.approved_by_name}（{req.approved_at ? new Date(req.approved_at).toLocaleDateString("ja-JP") : ""}）
                            </p>
                        )}

                        {req.status === "pending" && (
                            <div className="flex gap-2 mt-3">
                                <button
                                    onClick={() => handle(req.id, "approve")}
                                    disabled={processingId === req.id}
                                    className="px-4 py-1.5 text-sm rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                                >
                                    {processingId === req.id ? "処理中…" : "承認"}
                                </button>
                                <button
                                    onClick={() => handle(req.id, "reject")}
                                    disabled={processingId === req.id}
                                    className="px-4 py-1.5 text-sm rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 disabled:opacity-50"
                                >
                                    却下
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
