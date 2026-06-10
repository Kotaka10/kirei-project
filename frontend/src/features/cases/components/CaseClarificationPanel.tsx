import type { CaseClarification } from "../types/caseTypes";

interface Props {
    clarification: CaseClarification;
}

export function CaseClarificationPanel({ clarification }: Props) {
    return (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-semibold text-amber-800">案件登録前に確認したい情報があります</p>
            {clarification.missingFields.length > 0 && (
                <div className="mt-3">
                    <p className="text-xs font-medium text-amber-700">不足している情報</p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                        {clarification.missingFields.map(field => (
                            <span key={field} className="rounded bg-white px-2 py-1 text-xs text-amber-700">
                                {field}
                            </span>
                        ))}
                    </div>
                </div>
            )}
            {clarification.questions.length > 0 && (
                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-amber-700">
                    {clarification.questions.map(question => (
                        <li key={question}>{question}</li>
                    ))}
                </ul>
            )}
        </div>
    );
}
