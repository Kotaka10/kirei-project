import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCases } from "../hooks/useCases";
import { STATUS_LABEL, STATUS_COLOR, ROLE_LABEL, LEVEL_COLOR, levelLabel } from "../types/caseTypes";

export default function CasesPage() {
    const { cases, loading, error } = useCases();
    const navigate = useNavigate();
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");

    const filtered = cases.filter(c => {
        const matchStatus = statusFilter === "all" || c.status === statusFilter;
        const matchSearch =
            c.title.includes(search) || c.summary.includes(search);
        return matchStatus && matchSearch;
    });

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-800">案件一覧</h1>
                <button
                    onClick={() => navigate("/cases/new")}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                    + 新規案件登録
                </button>
            </div>

            {/* フィルター */}
            <div className="flex gap-3 mb-5">
                <input
                    type="text"
                    placeholder="案件名・概要で検索"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
                <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                >
                    <option value="all">すべて</option>
                    <option value="open">未対応</option>
                    <option value="in_progress">対応中</option>
                    <option value="closed">完了</option>
                </select>
            </div>

            {loading && (
                <div className="flex justify-center py-12">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
            )}

            {error && (
                <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm mb-4">{error}</div>
            )}

            {!loading && filtered.length === 0 && (
                <div className="text-center py-16 text-gray-400">
                    <p className="text-4xl mb-3">📋</p>
                    <p>案件がありません</p>
                </div>
            )}

            <div className="space-y-3">
                {filtered.map(c => (
                    <div
                        key={c.id}
                        onClick={() => navigate(`/cases/${c.id}`)}
                        className="bg-white border border-gray-200 rounded-xl p-5 cursor-pointer hover:shadow-md hover:border-blue-200 transition-all"
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[c.status]}`}>
                                        {STATUS_LABEL[c.status]}
                                    </span>
                                    <h2 className="font-semibold text-gray-800 truncate">{c.title}</h2>
                                </div>
                                <p className="text-sm text-gray-500 line-clamp-2">{c.summary}</p>
                                {((c.required_roles && c.required_roles.length > 0) || c.required_level != null) && (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {c.required_level != null && (
                                            <span className={`text-xs px-2 py-0.5 rounded font-medium ${LEVEL_COLOR[c.required_level] ?? "bg-gray-100 text-gray-600"}`}>
                                                {levelLabel(c.required_level)}
                                            </span>
                                        )}
                                        {c.required_roles?.map(r => (
                                            <span key={r} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                                                {ROLE_LABEL[r] ?? r}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="text-right shrink-0">
                                <p className="text-xs text-gray-400">
                                    {new Date(c.created_at).toLocaleDateString("ja-JP")}
                                </p>
                                {c.created_by_name && (
                                    <p className="text-xs text-gray-400 mt-0.5">{c.created_by_name}</p>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}