import { useState } from "react";
import type { Job, StaffOption } from "../types/jobTypes";

const ROLE_LABELS: Record<string, string> = {
    cleaner:    "清掃員",
    technician: "技術者",
    supervisor: "管理者",
};

interface Props {
    job:              Job;
    staffList:        StaffOption[];
    onSubmit:         (targetStaffId: number, note: string) => Promise<void>;
    onClose:          () => void;
}

export function AssignStaffModal({ job, staffList, onSubmit, onClose }: Props) {
    const [selectedId, setSelectedId] = useState<number | "">("");
    const [note,        setNote]        = useState("");
    const [submitting,  setSubmitting]  = useState(false);
    const [error,       setError]       = useState<string | null>(null);
    const [done,        setDone]        = useState(false);

    const assignedIds = new Set([
        ...(job.primary_staff_id ? [job.primary_staff_id] : []),
        ...job.additional_staff.map(s => s.staff_id),
    ]);

    const candidates = staffList.filter(s => !assignedIds.has(s.id));

    const handleSubmit = async () => {
        if (!selectedId) return;
        setSubmitting(true);
        setError(null);
        try {
            await onSubmit(selectedId, note);
            setDone(true);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
                <h2 className="text-lg font-bold text-gray-800 mb-1">スタッフを追加リクエスト</h2>
                <p className="text-sm text-gray-500 mb-4">
                    {job.service_type}（{job.customer_name} /
                    {new Date(job.scheduled_at).toLocaleDateString("ja-JP")}）
                </p>

                {done ? (
                    <div className="text-center py-6">
                        <p className="text-green-600 font-semibold mb-1">リクエストを送信しました</p>
                        <p className="text-sm text-gray-500 mb-4">管理者の承認をお待ちください</p>
                        <button onClick={onClose} className="px-4 py-2 bg-gray-100 rounded-lg text-sm hover:bg-gray-200">
                            閉じる
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">追加するスタッフ</label>
                            {candidates.length === 0 ? (
                                <p className="text-sm text-gray-400 italic">追加できるスタッフがいません</p>
                            ) : (
                                <select
                                    value={selectedId}
                                    onChange={e => setSelectedId(Number(e.target.value))}
                                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                                >
                                    <option value="">-- 選択してください --</option>
                                    {candidates.map(s => (
                                        <option key={s.id} value={s.id}>
                                            {s.name}（{ROLE_LABELS[s.role] ?? s.role}）
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">メモ（任意）</label>
                            <textarea
                                value={note}
                                onChange={e => setNote(e.target.value)}
                                rows={2}
                                placeholder="追加理由など"
                                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
                            />
                        </div>

                        {error && <p className="text-sm text-red-500 mb-3">{error}</p>}

                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 text-sm rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700"
                            >
                                キャンセル
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={!selectedId || submitting || candidates.length === 0}
                                className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                            >
                                {submitting ? "送信中…" : "リクエスト送信"}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
