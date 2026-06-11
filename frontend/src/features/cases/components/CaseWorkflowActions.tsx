import { openAiChat } from "../../ai/lib/chatWidgetEvents";
import type { CaseRecord } from "../types/caseTypes";

interface Props {
    caseRecord: CaseRecord;
}

type CaseAction = {
    label: string;
    description: string;
    buildPrompt: (caseRecord: CaseRecord) => string;
};

const CASE_ACTIONS: CaseAction[] = [
    {
        label: "概算を出す",
        description: "案件内容から料金幅を試算します",
        buildPrompt: (caseRecord) => buildCasePrompt(
            "この案件詳細をもとに概算金額を出してください。サービス別に基本料金、数量・単価、調整、税抜/税込目安が分かる内訳で説明してください。不足情報があれば最初に確認してください。",
            caseRecord,
        ),
    },
    {
        label: "見積書へ進む",
        description: "概算や不足確認から見積書作成へつなげます",
        buildPrompt: (caseRecord) => buildCasePrompt(
            "この案件詳細をもとに見積書作成へ進めてください。必要なら概算を出し、見積書にはサービス別の数量・単価・算出式・税抜金額が残るようにしてください。不足情報があれば確認してください。",
            caseRecord,
        ),
    },
    {
        label: "報告書下書き",
        description: "正式発行前の作業報告書案を作ります",
        buildPrompt: (caseRecord) => buildCasePrompt(
            "この案件詳細をもとに作業報告書の下書きだけを作成してください。正式な書類発行や保存はまだ行わないでください。不足している項目は「要確認」として、作成自体は止めずに完成フォーマットで出してください。",
            caseRecord,
        ),
    },
];

export function CaseWorkflowActions({ caseRecord }: Props) {
    return (
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">AIで次の業務へ進める</h3>
            <div className="grid gap-2 sm:grid-cols-3">
                {CASE_ACTIONS.map(action => (
                    <button
                        key={action.label}
                        onClick={() => openAiChat(action.buildPrompt(caseRecord))}
                        className="text-left rounded-lg border border-gray-200 px-3 py-3 hover:border-[#48bcb6] hover:bg-[#e8fbf8] transition-colors"
                    >
                        <span className="block text-sm font-semibold text-gray-800">{action.label}</span>
                        <span className="mt-1 block text-xs leading-relaxed text-gray-500">{action.description}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}

function buildCasePrompt(instruction: string, caseRecord: CaseRecord): string {
    const detail = compactCaseDetail(caseRecord);
    return `${instruction}\n\n【案件】${detail}`.slice(0, 1500);
}

function compactCaseDetail(caseRecord: CaseRecord): string {
    const document = caseRecord.document ? normalizeText(caseRecord.document).slice(0, 900) : "";
    return [
        `タイトル: ${caseRecord.title}`,
        `概要: ${normalizeText(caseRecord.summary).slice(0, 260)}`,
        document ? `詳細: ${document}` : "",
    ].filter(Boolean).join("\n");
}

function normalizeText(value: string): string {
    return value.replace(/\s+/g, " ").trim();
}
