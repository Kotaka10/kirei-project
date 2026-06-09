import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/context/AuthContext";
import { fetchCaseById, updateCaseStatus } from "../lib/caseApi";
import { STATUS_LABEL, STATUS_COLOR, ROLE_LABEL, LEVEL_COLOR, levelLabel } from "../types/caseTypes";
import type { CaseRecord } from "../types/caseTypes";

export default function CaseDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { token } = useAuth();
    const [c, setC] = useState<CaseRecord | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        if (!token || !id) return;
        fetchCaseById(Number(id), token)
            .then(setC)
            .catch(e => setError(e.message))
            .finally(() => setLoading(false));
    }, [id, token]);

    const handleStatusChange = async (status: "open" | "in_progress" | "closed") => {
        if (!token || !id || !c) return;
        setUpdating(true);
        try {
            await updateCaseStatus(Number(id), status, token);
            setC({ ...c, status });
        } catch (e: any) {
            setError(e.message);
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (error || !c) {
        return (
            <div className="p-6">
                <p className="text-red-500">{error ?? "案件が見つかりません"}</p>
                <button onClick={() => navigate("/cases")} className="mt-3 text-sm text-blue-600 hover:underline">
                    案件一覧に戻る
                </button>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-3xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
                <button
                    onClick={() => navigate("/cases")}
                    className="text-gray-400 hover:text-gray-600 text-sm"
                >
                    ← 案件一覧
                </button>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6 mb-4">
                <div className="flex items-start justify-between gap-4 mb-4">
                    <h1 className="text-2xl font-bold text-gray-800">{c.title}</h1>
                    <span className={`shrink-0 px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLOR[c.status]}`}>
                        {STATUS_LABEL[c.status]}
                    </span>
                </div>

                <div className="flex items-center gap-4 text-xs text-gray-400 mb-5">
                    {c.created_by_name && <span>登録者: {c.created_by_name}</span>}
                    <span>登録日: {new Date(c.created_at).toLocaleDateString("ja-JP")}</span>
                </div>

                <div className="flex flex-wrap items-center gap-2 mb-5">
                    {c.required_level != null && (
                        <>
                            <span className="text-sm text-gray-500">レベル感:</span>
                            <span className={`text-xs px-2 py-0.5 rounded font-medium ${LEVEL_COLOR[c.required_level] ?? "bg-gray-100 text-gray-600"}`}>
                                {levelLabel(c.required_level)}
                            </span>
                        </>
                    )}
                    {c.required_roles && c.required_roles.length > 0 && (
                        <>
                            <span className="text-sm text-gray-500 ml-2">必要ロール:</span>
                            {c.required_roles.map(r => (
                                <span key={r} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-medium">
                                    {ROLE_LABEL[r] ?? r}
                                </span>
                            ))}
                        </>
                    )}
                </div>

                <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-600 mb-2">案件概要</h3>
                    <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-lg p-4">{c.summary}</p>
                </div>

                {c.document && (
                    <div>
                        <h3 className="text-sm font-semibold text-gray-600 mb-2">AI生成書類</h3>
                        <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                            {c.document}
                        </div>
                    </div>
                )}
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">ステータス変更</h3>
                <div className="flex gap-2">
                    {(["open", "in_progress", "closed"] as const).map(s => (
                        <button
                            key={s}
                            onClick={() => handleStatusChange(s)}
                            disabled={updating || c.status === s}
                            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors disabled:cursor-not-allowed
                                ${c.status === s
                                    ? `${STATUS_COLOR[s]} opacity-80`
                                    : "border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                                }`}
                        >
                            {STATUS_LABEL[s]}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}