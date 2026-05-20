import  { useState, useRef, type KeyboardEvent } from "react";
import { ChatRequestSchema } from "../../types/chatTypes";

interface Props {
    onSend:    (message: string) => void;
    isLoading: boolean;
}

export function ChatInput({ onSend, isLoading }: Props) {
    const [value, setValue] = useState("");
    const [inputError, setInputError] = useState<string | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleSend = () => {
        setInputError(null);

        const result = ChatRequestSchema.safeParse({ message: value });
        if (!result.success) {
            setInputError(result.error.issues[0]?.message ?? "入力が不正です");
            return;
        }

        onSend(value.trim());
        setValue("");

        if (textareaRef.current) {
            textareaRef.current.style.height = "auto"; // 高さリセット
        }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            if (!isLoading) handleSend();
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setValue(e.target.value);
        setInputError(null);

        e.target.style.height = "auto";
        e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
    }

    const charCount   = value.length;
    const isOverLimit = charCount > 500;

    return (
        <div className="px-3 pb-3 pt-2 border-t border-gray-100 bg-white">
            {inputError && (
                <p className="text-xs text-red-500 mb-1.5 px-1">{inputError}</p>
            )}

            <div className={`
                flex items-end gap-2 rounded-xl border bg-gray-50 px-3 py-2 transition-colors duration-150
                ${isOverLimit ? "border-red-300" : "border-gray-200 focus-within:border-red-400"}
            `}>
                {/* resize-none = 手動リサイズ禁止, leading-relaxed = 行間を少し広めにする */}
                <textarea
                    ref={textareaRef}
                    value={value}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    placeholder="質問を入力してください..."
                    rows={1}
                    disabled={isLoading}
                    className="
                        flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 resize-none outline-none
                        leading-relaxed disabled:opacity-50
                    "
                    style={{ minHeight: "24px", maxHeight: "120pc" }}
                />

                {/* 文字カウンター */}
                <span className={`text-[10px] self-end ph-0.5 ${isOverLimit ? "text-red-500" : "text-gray-300"}`}>
                    {charCount}/500
                </span>

                {/* 返信ボタン */}
                {/*
                    self-end = 常に右下に揃えている, active: scale-95 = クリック中に95%サイズへ縮小, active: = ボタン押してる瞬間,
                    disabled:cursor-not-allowed = disabled時に禁止カーソル表示, transition-all = 全ての変化でアニメーション
                */}
                <button
                    onClick={handleSend}
                    disabled={isLoading || !value.trim() || isOverLimit}
                    className="
                        flex-shrink-0 w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center self-end
                        hover:bg-red-700 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 shadow-sm
                    "
                >
                    <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                    </svg>
                </button>
            </div>

            <p className="text-[10px] text-gray-300 text-center mt-1.5">
                Enterで送信 Shift + Enterで改行
            </p>
        </div>
    );
}