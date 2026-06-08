import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCases } from "../hooks/useCases";
import { ROLE_LABEL } from "../types/caseTypes";
import type { CreateCaseResponse } from "../types/caseTypes";

type Step = "input" | "generating" | "result";

export default function CreateCasePage() {
    const navigate = useNavigate();
    const { create } = useCases();
    const [summary, setSummary] = useState("");
    const [step, setStep] = useState<Step>("input");
    const [result, setResult] = useState<CreateCaseResponse | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async () => {
        if (summary.trim().length < 10) {
            setError("概要は10文字以上入力してください");
            return;
        }
        setError(null);
        setStep("generating");
        try {
            const res = await create(summary.trim());
            setResult(res);
            setStep("result");
        } catch (e: any) {
            setError(e.message);
            setStep("input");
        }
    };

    if (step === "generating") {
        return (
            <div className="p-6 max-w-2xl mx-auto">
                <div className="flex flex-col items-center justify-center py-24 gap-6">
                    <div className="w-14 h-14 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <div className="text-center">
                        <p className="text-lg font-semibold text-gray-700">AIが案件書類を作成中...</p>
                        <p className="text-sm text-gray-400 mt-1">適切なスタッフへOneSignal通知も自動で送信します</p>
                    </div>
                </div>
            </div>
        );
    }

    if (step === "result" && result) {
        return (
            <div className="p-6 max-w-3xl mx-auto">
                <div className="bg-green-50 border border-green-200 rounded-xl p-5 mb-6">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-green-600 text-xl">✓</span>
                        <p className="font-semibold text-green-800">案件を登録しました</p>
                    </div>
                    <p className="text-sm text-green-700">
                        {result.push
                            ? `OneSignalで${result.push.succeeded}/${result.push.attempted}名にプッシュ通知を送信しました`
                            : `${result.notifiedStaff.length}名のスタッフにプッシュ通知を送信しました`
                        }
                    </p>
                    {result.push && result.push.failed > 0 && (
                        <p className="text-xs text-amber-700 mt-2">
                            {result.push.failed}名はOneSignal通知に失敗しました。通知許可またはOneSignal設定を確認してください。
                        </p>
                    )}
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-6 mb-4">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">{result.case.title}</h2>

                    {result.case.required_roles && result.case.required_roles.length > 0 && (
                        <div className="flex gap-2 mb-4">
                            <span className="text-sm text-gray-500">必要ロール:</span>
                            {result.case.required_roles.map(r => (
                                <span key={r} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-medium">
                                    {ROLE_LABEL[r] ?? r}
                                </span>
                            ))}
                        </div>
                    )}

                    <div className="prose prose-sm max-w-none">
                        <h3 className="text-sm font-semibold text-gray-600 mb-2">AI生成書類</h3>
                        <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                            {result.case.document}
                        </div>
                    </div>
                </div>

                {result.notifiedStaff.length > 0 && (
                    <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
                        <h3 className="text-sm font-semibold text-gray-700 mb-3">通知を送ったスタッフ</h3>
                        <div className="flex flex-wrap gap-2">
                            {result.notifiedStaff.map(s => (
                                <div key={s.staff_id} className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
                                    <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 text-xs font-bold flex items-center justify-center">
                                        {s.name.charAt(0)}
                                    </span>
                                    <div>
                                        <p className="text-xs font-medium text-gray-800">{s.name}</p>
                                        <p className="text-[11px] text-gray-400">{ROLE_LABEL[s.role] ?? s.role}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex gap-3">
                    <button
                        onClick={() => navigate(`/cases/${result.case.id}`)}
                        className="flex-1 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
                    >
                        案件詳細を見る
                    </button>
                    <button
                        onClick={() => navigate("/cases")}
                        className="flex-1 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50"
                    >
                        案件一覧に戻る
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-2xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
                <button
                    onClick={() => navigate("/cases")}
                    className="text-gray-400 hover:text-gray-600 text-sm"
                >
                    ← 戻る
                </button>
                <h1 className="text-2xl font-bold text-gray-800">新規案件登録</h1>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
                <p className="text-sm text-blue-700">
                    案件の概要を入力すると、AIが自動で詳細書類を作成し、
                    適したスタッフへOneSignalでプッシュ通知を送信します。
                </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                    案件概要
                    <span className="text-gray-400 font-normal text-xs ml-2">（10〜2000文字）</span>
                </label>
                <textarea
                    value={summary}
                    onChange={e => setSummary(e.target.value)}
                    placeholder="例：大型商業施設の定期清掃案件。延床面積5000㎡、週3回の清掃が必要。高所作業あり。専門技術者が必要な特殊清掃機器を使用予定。来月から開始予定。"
                    rows={8}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
                />
                <p className="text-xs text-gray-400 mt-1 text-right">{summary.length} / 2000</p>

                {error && (
                    <p className="text-red-500 text-sm mt-2">{error}</p>
                )}

                <button
                    onClick={handleSubmit}
                    disabled={summary.trim().length < 10}
                    className="w-full mt-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                    AIで案件書類を作成 & 通知送信
                </button>
            </div>
        </div>
    );
}
