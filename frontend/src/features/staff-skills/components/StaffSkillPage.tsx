import { useState } from "react";
import { useAuth } from "../../auth/context/AuthContext";
import { useStaffSkills } from "../hooks/useStaffSkills";
import { SkillLevelEditor } from "./SkillLevelEditor";
import type { StaffWithSkills } from "../types/skillTypes";
import { ROLE_LABELS, CATEGORY_COLORS, SKILL_LEVEL_LABELS } from "../types/skillTypes";

export default function StaffSkillPage() {
    const { user }        = useAuth();
    const isSupervisor    = user?.role === "supervisor";
    const { staffList, skillMaster, loading, error, updateSkills } = useStaffSkills();

    const [editing,  setEditing]  = useState<StaffWithSkills | null>(null);
    const [search,   setSearch]   = useState("");
    const [roleFilter, setRoleFilter] = useState<string>("all");

    const filtered = staffList.filter(s => {
        const matchName = s.name.includes(search);
        const matchRole = roleFilter === "all" || s.role === roleFilter;
        return matchName && matchRole;
    });

    if (loading) return (
        <div className="flex items-center justify-center h-64 text-gray-500">読み込み中…</div>
    );
    if (error) return (
        <div className="p-6 text-red-500">エラー: {error}</div>
    );

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800">スタッフスキル管理</h1>
                <p className="text-sm text-gray-500 mt-1">
                    各スタッフのスキルと熟練度（1〜5）を確認・編集できます
                    {isSupervisor && " ／ 管理者は編集も可能です"}
                </p>
            </div>

            {/* 検索・フィルター */}
            <div className="flex gap-3 mb-5">
                <input
                    type="text"
                    placeholder="名前で検索…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="px-3 py-2 border rounded-lg text-sm w-48 focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
                <select
                    value={roleFilter}
                    onChange={e => setRoleFilter(e.target.value)}
                    className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                >
                    <option value="all">全役職</option>
                    <option value="cleaner">清掃員</option>
                    <option value="technician">技術者</option>
                    <option value="supervisor">管理者</option>
                </select>
                <span className="ml-auto text-sm text-gray-500 self-center">{filtered.length} 人</span>
            </div>

            {/* スタッフカード一覧 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filtered.map(staff => (
                    <div key={staff.id} className="border rounded-xl p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
                        {/* ヘッダー行 */}
                        <div className="flex items-start justify-between mb-3">
                            <div>
                                <span className="font-semibold text-gray-800">{staff.name}</span>
                                <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                                    {ROLE_LABELS[staff.role]}
                                </span>
                            </div>
                            {isSupervisor && (
                                <button
                                    onClick={() => setEditing(staff)}
                                    className="text-xs px-3 py-1 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 transition-colors"
                                >
                                    編集
                                </button>
                            )}
                        </div>

                        {/* スキルバッジ */}
                        {staff.skills.length === 0 ? (
                            <p className="text-xs text-gray-400 italic">スキル未登録</p>
                        ) : (
                            <div className="flex flex-wrap gap-1.5">
                                {staff.skills.map(sk => (
                                    <span
                                        key={sk.skill_id}
                                        title={`${SKILL_LEVEL_LABELS[sk.level]} (${sk.level}/5)`}
                                        className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${CATEGORY_COLORS[sk.category]}`}
                                    >
                                        {sk.skill_name}
                                        <span className="font-bold opacity-70">Lv.{sk.level}</span>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* 編集モーダル */}
            {editing && (
                <SkillLevelEditor
                    staff={editing}
                    skillMaster={skillMaster}
                    onSave={async (id, skills) => { await updateSkills(id, skills); }}
                    onClose={() => setEditing(null)}
                />
            )}
        </div>
    );
}
