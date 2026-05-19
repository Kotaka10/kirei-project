import { SUGGESTED_QUESTIONS } from "../../types/chat";

interface Props {
    onSelect: (question: string) => void;
}

export function SuggestedQuestions({ onSelect }: Props) {
    return (
        <div className="px-4 pb-3">
            <p className="text-[11px] text-gray-400 mb-2">よく使われる質問</p>
            <div className="flex flex-wrap gap-1.5">
                {SUGGESTED_QUESTIONS.map((q) => (
                    <button
                        key={q}
                        onClick={() => onSelect(q)}
                        className="
                            text-[11px] px-3 py-1.5 rounded-full border border-red-200 text-red-600 bg-red-50
                            hover:bg-red-100 transition-colors duration-150 whitespace-nowrap
                        "
                    >
                        {q}
                    </button>
                ))}
            </div>
        </div>
    );
}