import type { Connection } from "mysql2/promise";
import { getConnection } from "../db/connection.js";
import { AiQuestionRepository } from "../repositories/aiQuestionRepository.js";
import type { UserContext } from "../types/auth.js";
import type { AiQuestionResponse, AiQuestionSource, AiQuestionSuggestion } from "../types/aiQuestion.js";

interface QuestionCandidate extends AiQuestionSuggestion {
    score: number;
}

const MAX_QUESTIONS = 4;

const FALLBACK_BY_ROLE: Record<UserContext["role"], AiQuestionSuggestion[]> = {
    cleaner: [
        { question: "今日の自分のスケジュールを教えて", source: "role" },
        { question: "今日の持ち物を教えて", source: "role" },
        { question: "今日の作業報告書を作って", source: "role" },
        { question: "明日空いているスタッフは？", source: "role" },
    ],
    technician: [
        { question: "今日の自分のスケジュールを教えて", source: "role" },
        { question: "エアコン清掃の持ち物を教えて", source: "role" },
        { question: "今日の作業報告書を作って", source: "role" },
        { question: "明日空いているスタッフは？", source: "role" },
    ],
    supervisor: [
        { question: "今日の全スタッフの予定を教えて", source: "role" },
        { question: "明日空いているスタッフは？", source: "role" },
        { question: "今月の売上げを教えて", source: "role" },
        { question: "スタッフのスキル不足を分析して", source: "role" },
    ],
};

export class AiQuestionService {
    private readonly repo = new AiQuestionRepository();

    async getFrequentQuestions(ctx: UserContext): Promise<AiQuestionResponse> {
        const conn = await getConnection();
        try {
            return await this.buildQuestions(conn, ctx);
        } finally {
            await conn.end();
        }
    }

    private async buildQuestions(conn: Connection, ctx: UserContext): Promise<AiQuestionResponse> {
        const candidates: QuestionCandidate[] = [];

        const frequentQuestions = await this.repo.findFrequentQuestions(conn);
        addFrequentQuestions(candidates, frequentQuestions, 130);

        if (candidates.length === 0) addFallbackQuestions(candidates, ctx.role);

        const questions = selectTopQuestions(candidates);
        return { questions };
    }
}

function normalizeQuestion(question: string): string {
    return question.replace(/\s+/g, " ").trim().slice(0, 60);
}

function addQuestion(
    candidates: QuestionCandidate[],
    question:   string,
    source:     AiQuestionSource,
    score:      number,
): void {
    const normalized = normalizeQuestion(question);
    if (!normalized) return;
    candidates.push({ question: normalized, source, score });
}

function addFrequentQuestions(
    candidates: QuestionCandidate[],
    questions:  Array<{ question: string; usage_count: number }>,
    baseScore:  number,
): void {
    questions.forEach((row, index) => {
        addQuestion(candidates, row.question, "history", baseScore + Number(row.usage_count) * 8 - index);
    });
}

function addFallbackQuestions(candidates: QuestionCandidate[], role: UserContext["role"]): void {
    FALLBACK_BY_ROLE[role].forEach((item, index) => {
        addQuestion(candidates, item.question, item.source, 30 - index);
    });
}

function selectTopQuestions(candidates: QuestionCandidate[]): AiQuestionSuggestion[] {
    const seen = new Set<string>();
    return candidates
        .sort((a, b) => b.score - a.score)
        .filter(candidate => {
            const key = candidate.question.replace(/[？?。.\s]/g, "");
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        })
        .slice(0, MAX_QUESTIONS)
        .map(({ question, source }) => ({ question, source }));
}
