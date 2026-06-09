import { useState, useRef, useEffect } from "react";
import type { ChatSession } from "../../types/sessionTypes";

interface Props {
    sessions:        ChatSession[];
    isLoading:       boolean;
    activeSessionId: number | null;
    onSelectSession: (id: number) => void;
    onNewChat:       () => void;
    onRename:        (id: number, title: string) => Promise<void>;
    onDelete:        (id: number) => Promise<void>;
}

// 日付グループ分け
function groupByDate(sessions: ChatSession[]): { label: string; items: ChatSession[] }[] {
    const now       = new Date();
    const today     = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterday = today - 86_400_000;
    const lastWeek  = today - 7 * 86_400_000;

    const groups = [
        { label: "今日",      items: [] as ChatSession[] },
        { label: "昨日",      items: [] as ChatSession[] },
        { label: "過去7日間", items: [] as ChatSession[] },
        { label: "それ以前",  items: [] as ChatSession[] },
    ];

    for (const s of sessions) {
        const t = new Date(s.updated_at).getTime();
        if      (t >= today)     groups[0]!.items.push(s);
        else if (t >= yesterday) groups[1]!.items.push(s);
        else if (t >= lastWeek)  groups[2]!.items.push(s);
        else                     groups[3]!.items.push(s);
    }

    return groups.filter(g => g.items.length > 0);
}

// カテゴリ定義（このAIアシスタントに実装済みの機能ドメインに対応）
//   タイトル（＝最初の質問の冒頭）に含まれるキーワードで判定する。
//   配列の上から順に評価し、最初に一致したカテゴリへ振り分ける（曖昧なタイトル対策で
//   「報告書」「見積」「スケジュール」など意図が明確な語を先に、汎用的な作業ノウハウ語を後ろに置く）。
const CATEGORY_DEFS: { label: string; keywords: string[] }[] = [
    { label: "報告書・書類",       keywords: ["報告書", "作業報告", "完了報告", "見積書", "請求書", "納品書", "書類", "発行", "帳票"] },
    { label: "見積・営業",         keywords: ["見積", "概算", "料金", "いくら", "価格", "単価", "営業", "商談", "トーク"] },
    { label: "スケジュール・予約", keywords: ["スケジュール", "予定", "予約", "空き", "空いて", "シフト", "カレンダー"] },
    { label: "スタッフ・チーム",   keywords: ["スタッフ", "スキル", "チーム", "編成", "アサイン", "人材", "できる人", "担当", "割り当て", "役職"] },
    { label: "資材・道具",         keywords: ["資材", "道具", "備品", "持ち物", "仕入れ", "購入", "注文", "必要なもの", "持って", "買える", "買いたい"] },
    { label: "売上",               keywords: ["売上", "売り上げ", "収益", "業績"] },
    { label: "清掃ノウハウ",       keywords: ["ノウハウ", "コツ", "やり方", "方法", "手順", "テクニック", "落とし方", "落とす", "除去", "カビ", "油汚れ", "水垢", "フィルター"] },
];
const OTHER_CATEGORY = "その他";

/** セッションのタイトルからカテゴリ名を判定する */
function categorize(session: ChatSession): string {
    const title = session.title ?? "";
    for (const def of CATEGORY_DEFS) {
        if (def.keywords.some(kw => title.includes(kw))) return def.label;
    }
    return OTHER_CATEGORY;
}

// 日付グループ内のセッションをカテゴリごとに分ける（CATEGORY_DEFS の順、最後に その他）
function groupByCategory(sessions: ChatSession[]): { label: string; items: ChatSession[] }[] {
    const buckets = new Map<string, ChatSession[]>();
    for (const s of sessions) {
        const label = categorize(s);
        (buckets.get(label) ?? buckets.set(label, []).get(label)!).push(s);
    }
    const ordered = [...CATEGORY_DEFS.map(d => d.label), OTHER_CATEGORY];
    return ordered
        .filter(label => buckets.has(label))
        .map(label => ({ label, items: buckets.get(label)! }));
}

export function ChatHistory({ sessions, isLoading, activeSessionId, onSelectSession, onNewChat, onRename, onDelete }: Props) {
    const [editingId,    setEditingId]    = useState<number | null>(null);
    const [editingTitle, setEditingTitle] = useState("");
    const [deletingId,   setDeletingId]   = useState<number | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (editingId !== null) inputRef.current?.focus();
    }, [editingId]);

    function startRename(s: ChatSession, e: React.MouseEvent) {
        e.stopPropagation();
        setEditingId(s.id);
        setEditingTitle(s.title);
    }

    async function commitRename(id: number) {
        const title = editingTitle.trim();
        if (title && title.length <= 100) await onRename(id, title);
        setEditingId(null);
    }

    async function confirmDelete(id: number, e: React.MouseEvent) {
        e.stopPropagation();
        setDeletingId(id);
    }

    async function executeDelete(id: number) {
        await onDelete(id);
        setDeletingId(null);
    }

    const groups = groupByDate(sessions);

    // 1セッション分の行（日付グループ／カテゴリグループの両方から呼び出す）
    function renderSession(session: ChatSession) {
        return (
            <div key={session.id} className="relative group">
                {/* 削除確認オーバーレイ */}
                {deletingId === session.id && (
                    <div className="absolute inset-0 z-10 flex items-center justify-between bg-[#e8fbf8] border border-[#48bcb6] rounded-lg px-2 py-1 gap-1">
                        <span className="text-[11px] text-[#48bcb6] flex-1 truncate">削除しますか？</span>
                        <button
                            onClick={() => executeDelete(session.id)}
                            className="text-[11px] px-2 py-0.5 bg-[#48bcb6] text-white rounded hover:opacity-90"
                        >
                            削除
                        </button>
                        <button
                            onClick={() => setDeletingId(null)}
                            className="text-[11px] px-2 py-0.5 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                        >
                            取消
                        </button>
                    </div>
                )}

                <button
                    onClick={() => onSelectSession(session.id)}
                    className={`
                        w-full text-left px-2 py-2 rounded-lg text-sm transition-colors
                        flex items-center gap-1
                        ${session.id === activeSessionId
                            ? "bg-[#e8fbf8] text-[#48bcb6]"
                            : "hover:bg-gray-100 text-gray-700"}
                    `}
                >
                    {editingId === session.id ? (
                        <input
                            ref={inputRef}
                            value={editingTitle}
                            onChange={e => setEditingTitle(e.target.value)}
                            onBlur={() => commitRename(session.id)}
                            onKeyDown={e => {
                                if (e.key === "Enter")  commitRename(session.id);
                                if (e.key === "Escape") setEditingId(null);
                            }}
                            onClick={e => e.stopPropagation()}
                            maxLength={100}
                            className="flex-1 min-w-0 bg-white border border-[#48bcb6] rounded px-1 text-sm outline-none"
                        />
                    ) : (
                        <span className="flex-1 truncate">{session.title}</span>
                    )}

                    {/* ホバー時のアクションボタン */}
                    {editingId !== session.id && (
                        <span className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                            <span
                                role="button"
                                onClick={e => startRename(session, e)}
                                className="p-0.5 rounded hover:bg-gray-200"
                                title="名前を変更"
                            >
                                <svg className="w-3 h-3 text-gray-500" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                                </svg>
                            </span>
                            <span
                                role="button"
                                onClick={e => confirmDelete(session.id, e)}
                                className="p-0.5 rounded hover:bg-[#e8fbf8]"
                                title="削除"
                            >
                                <svg className="w-3 h-3 text-gray-400 hover:text-[#48bcb6]" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                                </svg>
                            </span>
                        </span>
                    )}
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col flex-1 overflow-hidden bg-gray-50">
            {/* 新規チャットボタン */}
            <div className="px-3 py-3 border-b border-gray-200 flex-shrink-0">
                <button
                    onClick={onNewChat}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-[#48bcb6] text-[#48bcb6] hover:bg-[#e8fbf8] transition-colors text-sm font-medium"
                >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 13H13v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                    </svg>
                    新しいチャット
                </button>
            </div>

            {/* セッション一覧 */}
            <div className="flex-1 overflow-y-auto px-2 py-2">
                {isLoading && (
                    <div className="flex justify-center py-8">
                        <div className="w-5 h-5 border-2 border-[#e8fbf8] border-t-[#48bcb6] rounded-full animate-spin" />
                    </div>
                )}

                {!isLoading && sessions.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
                        <svg className="w-10 h-10 text-gray-300" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
                        </svg>
                        <p className="text-xs text-gray-400">履歴はまだありません</p>
                    </div>
                )}

                {groups.map(group => (
                    <div key={group.label} className="mb-3">
                        <p className="text-xs font-semibold text-[#48bcb6] uppercase tracking-wider px-2 pb-1">
                            {group.label}
                        </p>
                        {/* 日付グループ内をさらにカテゴリごとに分ける */}
                        {groupByCategory(group.items).map(cat => (
                            <div key={cat.label} className="mb-2">
                                <p className="flex items-center gap-1 text-[10px] font-medium text-gray-400 px-2 pb-0.5">
                                    <span className="inline-block w-1 h-1 rounded-full bg-[#48bcb6]" />
                                    {cat.label}
                                </p>
                                {cat.items.map(renderSession)}
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}
