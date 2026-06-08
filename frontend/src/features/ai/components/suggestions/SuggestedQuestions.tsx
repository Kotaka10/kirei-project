import type { AiQuestionSuggestion } from "../../types/aiQuestionTypes";

interface Props {
    questions:  AiQuestionSuggestion[];
    isLoading?: boolean;
    onSelect:   (question: string) => void;
}

export function SuggestedQuestions({ questions, isLoading = false, onSelect }: Props) {
    return (
        <div className="px-4 py-3 bg-[#e8fbf8] border-t border-[#48bcb6]">
            <div className="flex items-center gap-2 mb-2">
                <p className="text-[11px] text-[#48bcb6]">よく使われる質問</p>
                {isLoading && <span className="h-1.5 w-1.5 rounded-full bg-[#48bcb6] animate-pulse" />}
            </div>
            <div className="flex flex-wrap gap-1.5">
                {questions.map(({ question }) => (
                    <button
                        key={question}
                        onClick={() => onSelect(question)}
                        className="
                            max-w-full text-left text-[11px] px-3 py-1.5 rounded-full border border-[#48bcb6]
                            text-[#48bcb6] bg-[#e8fbf8] hover:opacity-90 transition-opacity duration-150
                            whitespace-normal break-words leading-snug
                        "
                    >
                        {question}
                    </button>
                ))}
            </div>
        </div>
    );
}
