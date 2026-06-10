import OpenAI from "openai";
import dotenv from "dotenv";
import { findRequiredCaseClarification, type CaseClarification } from "./caseClarificationRules.js";
import { CASE_DOCUMENT_FORMAT_INSTRUCTIONS, normalizeCaseDocument } from "./caseDocumentFormat.js";

dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface CaseAiDraft {
    title: string;
    document: string;
    requiredRoles: string[];
    requiredLevel: number;
}

export class CaseClarificationNeededError extends Error {
    readonly missingFields: string[];
    readonly questions: string[];

    constructor(clarification: CaseClarification) {
        super("案件作成に必要な情報が不足しています");
        this.name = "CaseClarificationNeededError";
        this.missingFields = clarification.missingFields;
        this.questions = clarification.questions;
    }
}

interface CaseReadinessResult {
    ready: boolean;
    missingFields?: unknown;
    questions?: unknown;
}

export class CaseAiService {
    async buildCaseDraft(summary: string): Promise<CaseAiDraft> {
        const clarification = await this.checkClarificationNeeded(summary);
        if (clarification) throw new CaseClarificationNeededError(clarification);
        return this.generateCaseDocument(summary);
    }

    private async checkClarificationNeeded(summary: string): Promise<CaseClarification | null> {
        const requiredClarification = findRequiredCaseClarification(summary);
        if (requiredClarification) return requiredClarification;

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            response_format: { type: "json_object" },
            messages: [
                {
                    role: "system",
                    content: `あなたは清掃会社の案件受付担当です。
案件概要を読み、案件詳細書類を作成できるだけの最低限の情報があるか判定してください。

作業日時・希望時期と現場場所は既に別処理で必須確認済みです。
そのうえで、以下が大きく欠けていて、AIが推測すると現場トラブルになりそうな場合だけ ready=false にします。
- 作業内容またはサービス種別
- 現場の種類・場所・規模のいずれか
- 希望時期・頻度・緊急度のいずれか
- 特別な制約、危険、高所、鍵、立入、顧客要望など重要条件

軽微な不足は ready=true とし、書類内で「要確認」として扱える前提にしてください。
必ず以下のJSONのみで返してください。
{
  "ready": true または false,
  "missingFields": ["不足項目"],
  "questions": ["ユーザーに確認する短い質問"]
}`,
                },
                {
                    role: "user",
                    content: `案件概要:\n${summary}`,
                },
            ],
            temperature: 0,
        });

        const parsed = parseJson<CaseReadinessResult>(completion.choices[0]?.message?.content);
        if (!parsed || parsed.ready !== false) return null;

        const missingFields = toStringArray(parsed.missingFields).slice(0, 5);
        const questions = toStringArray(parsed.questions).slice(0, 5);
        if (missingFields.length === 0 && questions.length === 0) return null;

        return {
            missingFields,
            questions: questions.length > 0 ? questions : missingFields.map(field => `${field}を教えてください`),
        };
    }

    private async generateCaseDocument(summary: string): Promise<CaseAiDraft> {
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            response_format: { type: "json_object" },
            messages: [
                {
                    role: "system",
                    content: `あなたはクリーニング・清掃サービス会社の案件管理アシスタントです。
案件の概要を受け取り、以下のJSON形式で詳細な案件書類を作成してください。

{
  "title": "案件タイトル（30文字以内）",
  "document": "固定フォーマットの案件詳細書類（Markdown形式）",
  "requiredRoles": ["cleaner", "technician", "supervisor"] の中から必要なロールのみを配列で返す,
  "requiredLevel": 1〜5の整数で、案件に求められるスタッフのレベル感（難易度）
}

- title: 案件の内容を端的に表すタイトル
- document: 800〜1500文字程度の詳細な案件書類
${CASE_DOCUMENT_FORMAT_INSTRUCTIONS}
- 入力概要に含まれる作業内容、日時、場所、現場種別、規模、注意事項、顧客要望は省略せず、必ず対応する見出しへ転記してください。
- 固定フォーマットを優先しつつ、入力概要にある具体情報を一般化しすぎないでください。
- requiredRoles: 案件に必要なスタッフのロール。cleaner（清掃員）・technician（技術者）・supervisor（監督者）から選択。
  複雑な案件は複数可。全員に通知したい場合は空配列 []
- requiredLevel: 案件内容から判断した必要なスキルレベル（難易度）を以下の基準で1〜5の整数で返す。
  1（見習い）: 単純・短時間の軽作業（一般的な拭き掃除、ゴミ回収など）
  2（初級）  : 標準的な清掃作業（一般的なハウスクリーニングなど）
  3（中級）  : 専門器具や一定の技術を要する作業（エアコン清掃、機械操作など）
  4（上級）  : 高度な技術・分解洗浄・高所作業・規模の大きい現場対応
  5（エキスパート）: 特殊清掃や高リスク作業、統括・顧客折衝を伴う大型/難案件`,
                },
                {
                    role: "user",
                    content: `以下の概要から案件書類を作成してください:\n\n${summary}`,
                },
            ],
        });

        const parsed = parseJson<Record<string, unknown>>(completion.choices[0]?.message?.content);
        const document = typeof parsed?.document === "string" ? parsed.document : summary;
        return {
            title: typeof parsed?.title === "string" ? parsed.title : summary.slice(0, 30),
            document: normalizeCaseDocument(document, summary),
            requiredRoles: toStringArray(parsed?.requiredRoles).filter(role =>
                ["cleaner", "technician", "supervisor"].includes(role),
            ),
            requiredLevel: normalizeLevel(parsed?.requiredLevel),
        };
    }
}

function parseJson<T>(raw: string | null | undefined): T | null {
    try {
        return JSON.parse(raw ?? "{}") as T;
    } catch {
        return null;
    }
}

function toStringArray(value: unknown): string[] {
    return Array.isArray(value)
        ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
        : [];
}

function normalizeLevel(value: unknown): number {
    const n = Math.round(Number(value));
    if (!Number.isFinite(n)) return 3;
    return Math.min(5, Math.max(1, n));
}
