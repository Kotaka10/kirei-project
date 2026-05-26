import { useState } from "react";
import { useJobs } from "../hooks/useJobs";
import { AssignStaffModal } from "./AssignStaffModal";
import type { Job } from "../types/jobTypes";

const STATUS_LABELS: Record<string, string> = {
    scheduled:  "予定",
    completed:  "完了",
    cancelled:  "キャンセル",
};

const STATUS_COLORS: Record<string, string> = {
    scheduled: "bg-blue-100 text-blue-700",
    completed: "bg-green-100 text-green-700",
    cancelled: "bg-gray-100 text-gray-500",
};

export default function JobListPage() {
    const today = new Date().toISOString().slice(0, 10);
    const [date,    setDate]    = useState(today);
    const [target,  setTarget]  = useState<Job | null>(null);

    const { jobs, staff, loading, error, refetch, requestAssignment } = useJobs(date);

    const handleAssign = async (targetStaffId: number, note: string) => {
        if (!target) return;
        await requestAssignment(target.id, targetStaffId, note);
        await refetch();
    };

    return (
        <div className="p-6 max-w-3xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800">ジョブ一覧</h1>
                <p className="text-sm text-gray-500 mt-1">
                    スタッフを追加したいジョブを選択してリクエストを送信できます（管理者の承認が必要です）
                </p>
            </div>

            <div className="mb-5">
                <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
            </div>

            {loading && <p className="text-gray-400 text-sm">読み込み中…</p>}
            {error   && <p className="text-red-500 text-sm">エラー: {error}</p>}

            {!loading && !error && jobs.length === 0 && (
                <p className="text-gray-400 text-sm italic">この日のジョブはありません</p>
            )}

            <div className="flex flex-col gap-3">
                {jobs.map(job => (
                    <div key={job.id} className="border rounded-xl p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-2">
                            <div>
                                <span className="font-semibold text-gray-800">{job.service_type}</span>
                                <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[job.status] ?? "bg-gray-100 text-gray-600"}`}>
                                    {STATUS_LABELS[job.status] ?? job.status}
                                </span>
                            </div>
                            <button
                                onClick={() => setTarget(job)}
                                className="text-xs px-3 py-1 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 transition-colors"
                            >
                                ＋ スタッフ追加
                            </button>
                        </div>

                        <p className="text-sm text-gray-500 mb-2">
                            {job.customer_name} ／{" "}
                            {new Date(job.scheduled_at).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}
                            ／ ¥{job.price.toLocaleString()}
                        </p>

                        <div className="flex flex-wrap gap-1.5">
                            {job.primary_staff_name && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                                    👤 {job.primary_staff_name}（担当）
                                </span>
                            )}
                            {job.additional_staff.map(s => (
                                <span key={s.assignment_id} className="text-xs px-2 py-0.5 rounded-full bg-teal-100 text-teal-700">
                                    ＋ {s.staff_name}
                                </span>
                            ))}
                            {!job.primary_staff_name && job.additional_staff.length === 0 && (
                                <span className="text-xs text-gray-400 italic">担当スタッフ未定</span>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {target && (
                <AssignStaffModal
                    job={target}
                    staffList={staff}
                    onSubmit={handleAssign}
                    onClose={() => setTarget(null)}
                />
            )}
        </div>
    );
}
