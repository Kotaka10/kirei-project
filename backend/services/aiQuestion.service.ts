import type { Connection } from "mysql2/promise";
import { getConnection } from "../db/connection.js";
import { AiQuestionRepository } from "../repositories/aiQuestionRepository.js";
import type { UserContext } from "../types/auth.js";
import type { AiQuestionResponse, AiQuestionSource, AiQuestionSuggestion, UpcomingJobRow } from "../types/aiQuestion.js";

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
        const today    = formatTokyoDate(new Date());
        const tomorrow = formatTokyoDate(addDaysInTokyo(new Date(), 1));
        const weekEnd  = formatTokyoDate(addDaysInTokyo(new Date(), 7));

        const candidates: QuestionCandidate[] = [];
        const add = (question: string, source: AiQuestionSource, score: number) => {
            const normalized = normalizeQuestion(question);
            if (!normalized) return;
            candidates.push({ question: normalized, source, score });
        };

        const frequentQuestions = await this.repo.findFrequentQuestions(conn);
        frequentQuestions.forEach((row, index) => {
            add(row.question, "history", 130 + Number(row.usage_count) * 8 - index);
        });

        const upcomingJobs = await this.repo.findUpcomingJobs(conn, ctx, today, weekEnd);
        this.addScheduleCandidates(candidates, upcomingJobs, today, tomorrow, ctx);

        const popularServices = await this.repo.findPopularServiceTypes(conn, ctx);
        popularServices.forEach((row, index) => {
            if (ctx.role === "supervisor") {
                add(`${row.service_type}の営業トークを教えて`, "service", 70 - index);
            } else {
                add(`${row.service_type}の持ち物を教えて`, "service", 70 - index);
            }
        });

        const recentQuestions = await this.repo.findRecentUserQuestions(conn, ctx.staffId);
        for (const row of recentQuestions) {
            this.addRecentIntentCandidates(add, row.content, ctx);
        }

        FALLBACK_BY_ROLE[ctx.role].forEach((item, index) => {
            add(item.question, item.source, 30 - index);
        });

        const questions = selectTopQuestions(candidates);
        return { questions };
    }

    private addScheduleCandidates(
        candidates: QuestionCandidate[],
        jobs:       UpcomingJobRow[],
        today:      string,
        tomorrow:   string,
        ctx:        UserContext,
    ): void {
        const add = (question: string, source: AiQuestionSource, score: number) => {
            const normalized = normalizeQuestion(question);
            if (!normalized) return;
            candidates.push({ question: normalized, source, score });
        };

        const todayJob = jobs.find(job => job.date === today);
        if (todayJob) {
            const target = ctx.role === "supervisor" ? "今日の全スタッフ" : "今日の自分";
            add(`${target}のスケジュールを教えて`, "schedule", 92);
            add(`今日の${todayJob.service_type}の持ち物を教えて`, "schedule", 90);
            add(`今日の${todayJob.customer_name}の作業報告書を作って`, "schedule", 86);
        }

        const tomorrowJob = jobs.find(job => job.date === tomorrow);
        if (tomorrowJob) {
            add(`明日の${tomorrowJob.service_type}の準備物を教えて`, "schedule", 82);
        }

        if (ctx.role === "supervisor" && jobs.length > 0) {
            const nextService = jobs[0]!.service_type;
            add(`${nextService}に合うスタッフを教えて`, "schedule", 84);
        }
    }

    private addRecentIntentCandidates(
        add:      (question: string, source: AiQuestionSource, score: number) => void,
        content:  string,
        ctx:      UserContext,
    ): void {
        if (/売上|sales/i.test(content)) {
            add("今月の売上げを教えて", "history", 58);
        }
        if (/予定|スケジュール|schedule/i.test(content)) {
            add(ctx.role === "supervisor" ? "今日の全スタッフの予定を教えて" : "今日の自分のスケジュールを教えて", "history", 58);
        }
        if (/空き|空いて|availability/i.test(content)) {
            add("明日空いているスタッフは？", "history", 56);
        }
        if (/見積|概算|営業|トーク/.test(content)) {
            add("新規顧客への営業トークを教えて", "history", 56);
        }
        if (/資材|持ち物|材料|道具/.test(content)) {
            add("今日の持ち物を教えて", "history", 54);
        }
        if (/報告書|請求書|見積書|書類/.test(content)) {
            add("今日の作業報告書を作って", "history", 52);
        }
    }
}

function normalizeQuestion(question: string): string {
    return question.replace(/\s+/g, " ").trim().slice(0, 60);
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

function formatTokyoDate(date: Date): string {
    const parts = new Intl.DateTimeFormat("ja-JP", {
        timeZone: "Asia/Tokyo",
        year:     "numeric",
        month:    "2-digit",
        day:      "2-digit",
    }).formatToParts(date);

    const year  = parts.find(part => part.type === "year")?.value;
    const month = parts.find(part => part.type === "month")?.value;
    const day   = parts.find(part => part.type === "day")?.value;

    return `${year}-${month}-${day}`;
}

function addDaysInTokyo(date: Date, days: number): Date {
    const base = new Date(`${formatTokyoDate(date)}T12:00:00+09:00`);
    base.setUTCDate(base.getUTCDate() + days);
    return base;
}
