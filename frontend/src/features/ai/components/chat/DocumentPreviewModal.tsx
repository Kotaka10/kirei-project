import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../../auth/context/AuthContext";

interface Props {
    documentPath: string; // "/api/documents/123" 形式
    onClose: () => void;
}

const API_BASE = import.meta.env.VITE_API_URL ?? "";

export function DocumentPreviewModal({ documentPath, onClose }: Props) {
    const { token } = useAuth();
    const [blobUrl, setBlobUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const blobUrlRef = useRef<string | null>(null);

    // Escape キーで閉じる
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);

    // 書類 HTML を auth ヘッダー付きで取得 → Blob URL に変換
    useEffect(() => {
        if (!token) {
            setFetchError("ログインが必要です");
            setIsLoading(false);
            return;
        }

        const fullUrl = `${API_BASE}${documentPath}`;

        fetch(fullUrl, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => {
                if (!res.ok) throw new Error(`書類の取得に失敗しました（${res.status}）`);
                return res.blob();
            })
            .then((blob) => {
                const url = URL.createObjectURL(blob);
                blobUrlRef.current = url;
                setBlobUrl(url);
            })
            .catch((err: unknown) => {
                const msg = err instanceof Error ? err.message : "不明なエラー";
                setFetchError(msg);
            })
            .finally(() => setIsLoading(false));

        return () => {
            // モーダルを閉じたら Blob URL を解放してメモリリークを防ぐ
            if (blobUrlRef.current) {
                URL.revokeObjectURL(blobUrlRef.current);
                blobUrlRef.current = null;
            }
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, documentPath]);

    const handlePrint = () => {
        if (!blobUrl) return;
        const win = window.open(blobUrl, "_blank");
        win?.addEventListener("load", () => win.print());
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            {/* 背景オーバーレイ */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* モーダル本体 */}
            <div className="relative z-10 flex flex-col w-full max-w-4xl h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden">
                {/* ヘッダー */}
                <div className="flex items-center justify-between px-5 py-3 bg-[#48bcb6] text-white flex-shrink-0">
                    <span className="font-semibold text-sm">📄 書類プレビュー</span>
                    <div className="flex items-center gap-2">
                        {blobUrl && (
                            <button
                                onClick={handlePrint}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-medium transition-colors"
                            >
                                🖨️ 印刷 / PDF保存
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
                            aria-label="閉じる"
                        >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* コンテンツ */}
                <div className="flex-1 overflow-hidden">
                    {isLoading && (
                        <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-500">
                            <div className="w-8 h-8 border-4 border-[#e8fbf8] border-t-[#48bcb6] rounded-full animate-spin" />
                            <p className="text-sm">書類を読み込んでいます...</p>
                        </div>
                    )}

                    {fetchError && (
                        <div className="flex flex-col items-center justify-center h-full gap-2 text-[#48bcb6]">
                            <p className="text-sm font-medium">⚠️ {fetchError}</p>
                            <button
                                onClick={onClose}
                                className="mt-2 text-xs text-gray-400 underline"
                            >
                                閉じる
                            </button>
                        </div>
                    )}

                    {blobUrl && (
                        <iframe
                            src={blobUrl}
                            className="w-full h-full border-0"
                            title="書類プレビュー"
                            sandbox="allow-scripts allow-same-origin"
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
