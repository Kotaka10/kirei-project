import { useState } from "react";
import type { Skill, StaffWithSkills } from "../types/skillTypes";
import { SKILL_LEVEL_LABELS, CATEGORY_COLORS } from "../types/skillTypes";

interface Props {
    staff:        StaffWithSkills;
    skillMaster:  Skill[];
    onSave:       (staffId: number, skills: { skill_id: number; level: number }[]) => Promise<void>;
    onClose:      () => void;
}

export function SkillLevelEditor({ staff, skillMaster, onSave, onClose }: Props) {
    // Object.fromEntries()：[key, value] 配列 → Object に変換
    const initialLevels = Object.fromEntries(staff.skills.map(s => [s.skill_id, s.level]));
    const [levels, setLevels] = useState<Record<number, number>>(initialLevels);
    const [saving, setSaving] = useState(false);
    const [error,  setError]  = useState<string | null>(null);

    const grouped = skillMaster.reduce<Record<string, Skill[]>>((acc, sk) => {
        (acc[sk.category] ??= []).push(sk); // 左の値がnull/undefinedなら右の値を代入
        return acc;
    }, {});

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        try {
            // Object.entries(levels)：オブジェクト → [key, value][] 配列
            const skills = Object.entries(levels)
                .filter(([, lv]) => lv > 0) //id は使わない lv だけ使う
                .map(([id, level]) => ({ skill_id: Number(id), level }));
            await onSave(staff.id, skills);
            onClose();
        } catch (e: any) {
            setError(e.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] flex flex-col">
                {/* ヘッダー */}
                <div className="px-6 py-4 border-b flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold">{staff.name}</h2>
                        <p className="text-sm text-gray-500">スキル・熟練度を編集</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
                </div>

                {/* スキル一覧 */}
                <div className="overflow-y-auto flex-1 px-6 py-4 space-y-5">
                    {Object.entries(grouped).map(([category, skills]) => (
                        <div key={category}>
                            <h3 className={`text-xs font-semibold px-2 py-0.5 rounded-full inline-block mb-2 ${CATEGORY_COLORS[category]}`}>
                                {category}
                            </h3>
                            <div className="space-y-2">
                                {skills.map(sk => (
                                    <div key={sk.id} className="flex items-center gap-3">
                                        <span className="w-36 text-sm text-gray-700 shrink-0">{sk.name}</span>
                                        <div className="flex gap-1">
                                            {/* 0 = 未設定ボタン */}
                                            <button
                                                onClick={() => setLevels(p => ({ ...p, [sk.id]: 0 }))}
                                                className={`w-8 h-8 rounded text-xs border transition-colors ${
                                                    (levels[sk.id] ?? 0) === 0
                                                        ? "bg-gray-200 border-gray-400 text-gray-600 font-bold"
                                                        : "border-gray-200 text-gray-300 hover:border-gray-400"
                                                }`}
                                            >
                                                −
                                            </button>
                                            {[1, 2, 3, 4, 5].map(lv => (
                                                <button
                                                    key={lv}
                                                    onClick={() => setLevels(p => ({ ...p, [sk.id]: lv }))}
                                                    title={SKILL_LEVEL_LABELS[lv]}
                                                    className={`w-8 h-8 rounded text-xs font-bold border transition-colors ${
                                                        (levels[sk.id] ?? 0) >= lv
                                                            ? "bg-blue-500 border-blue-500 text-white"
                                                            : "border-gray-200 text-gray-300 hover:border-blue-300"
                                                    }`}
                                                >
                                                    {lv}
                                                </button>
                                            ))}
                                        </div>
                                        {(levels[sk.id] ?? 0) > 0 && (
                                            <span className="text-xs text-gray-500">
                                                {SKILL_LEVEL_LABELS[levels[sk.id]!]}
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* フッター */}
                <div className="px-6 py-4 border-t flex items-center justify-between">
                    {error && <p className="text-sm text-red-500">{error}</p>}
                    <div className="flex gap-2 ml-auto">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50"
                        >
                            キャンセル
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                            {saving ? "保存中…" : "保存"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
