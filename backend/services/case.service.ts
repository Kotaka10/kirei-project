import OpenAI from "openai";
import dotenv from "dotenv";
import { CaseRepository } from "../repositories/caseRepository.js";
import { sendPushToUser } from "./notificationService.js";
import type { CasePushSummary, CaseRecord, CaseNotificationRecord, NotifiedStaff } from "../types/case.js";
dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export class CaseService {
    private readonly repo = new CaseRepository();

    async createCase(
        summary: string,
        createdBy: number,
    ): Promise<{ case: CaseRecord; notifiedStaff: NotifiedStaff[]; push: CasePushSummary }> {
        // AIが案件タイトル・書類・適切なロール・難易度レベルを生成
        const aiResult = await this.generateCaseDocument(summary);

        const caseId = await this.repo.create(
            aiResult.title,
            summary,
            aiResult.document,
            aiResult.requiredRoles,
            aiResult.requiredLevel,
            createdBy,
        );

        // ロール（あれば）で絞り込みつつ、案件レベルの±1帯に収まる
        // 「レベル感に適した」スタッフだけを特定して通知する
        const staffList = await this.repo.findMatchingStaff(
            aiResult.requiredRoles,
            aiResult.requiredLevel,
        );

        // DB通知レコード作成
        await this.repo.createNotifications(caseId, staffList.map(s => s.staff_id));

        const push = await this.sendCasePushNotifications(
            caseId,
            aiResult.title,
            aiResult.requiredLevel,
            staffList,
        );

        const created = await this.repo.findById(caseId);
        return { case: created!, notifiedStaff: staffList, push };
    }

    private async sendCasePushNotifications(
        caseId: number,
        title:  string,
        requiredLevel: number,
        staffList: NotifiedStaff[],
    ): Promise<CasePushSummary> {
        const results = await Promise.allSettled( // 全員分の結果が出るまで待つメソッド Promise.all() → 即座に中断 Promise.allSettled() → 残りも続ける
            staffList.map(staff =>
                sendPushToUser({
                    externalId: `user-${staff.staff_id}`,
                    title: "あなたのレベルに合った新しい案件です",
                    body: title,
                    data: {
                        type: "case_created",
                        case_id: caseId,
                        required_level: requiredLevel,
                    },
                }),
            ),
        );

        const errors: CasePushSummary["errors"] = [];
        results.forEach((result, index) => {
            if (result.status === "fulfilled") return;
            const staff = staffList[index];
            if (!staff) return;
            errors.push({
                staff_id: staff.staff_id,
                name: staff.name,
                message: result.reason instanceof Error ? result.reason.message : String(result.reason),
            });
        });

        return {
            provider:  "onesignal",
            attempted: staffList.length,
            succeeded: results.filter(result => result.status === "fulfilled").length,
            failed:    errors.length,
            errors,
        };
    }

    private async generateCaseDocument(summary: string): Promise<{
        title: string;
        document: string;
        requiredRoles: string[];
        requiredLevel: number;
    }> {
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
  "document": "案件詳細書類（Markdown形式で作成。概要・目的・作業内容・注意事項・スケジュール目安を含む）",
  "requiredRoles": ["cleaner", "technician", "supervisor"] の中から必要なロールのみを配列で返す,
  "requiredLevel": 1〜5の整数で、案件に求められるスタッフのレベル感（難易度）
}

- title: 案件の内容を端的に表すタイトル
- document: 800〜1500文字程度の詳細な案件書類（見出しを使った構造化された内容）
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

        const raw = completion.choices[0]?.message?.content ?? "{}";
        try {
            const parsed = JSON.parse(raw);
            return {
                title: parsed.title ?? summary.slice(0, 30),
                document: parsed.document ?? summary,
                requiredRoles: Array.isArray(parsed.requiredRoles)
                    ? parsed.requiredRoles.filter((r: string) =>
                          ["cleaner", "technician", "supervisor"].includes(r),
                      )
                    : [],
                requiredLevel: this.normalizeLevel(parsed.requiredLevel),
            };
        } catch {
            return {
                title: summary.slice(0, 30),
                document: summary,
                requiredRoles: [],
                requiredLevel: 3, // 判定不能時は中級として中庸な帯に通知する
            };
        }
    }

    /** AIが返したレベルを 1〜5 の整数に丸める（不正値は中級=3） */
    private normalizeLevel(value: unknown): number {
        const n = Math.round(Number(value));
        if (!Number.isFinite(n)) return 3;
        return Math.min(5, Math.max(1, n));
    }

    async getCases(): Promise<CaseRecord[]> {
        return this.repo.findAll();
    }

    async getCaseById(id: number): Promise<CaseRecord | null> {
        return this.repo.findById(id);
    }

    async updateStatus(id: number, status: "open" | "in_progress" | "closed"): Promise<void> {
        await this.repo.updateStatus(id, status);
    }

    async getNotifications(staffId: number): Promise<CaseNotificationRecord[]> {
        return this.repo.findNotificationsByStaff(staffId);
    }

    async markRead(notificationId: number, staffId: number): Promise<void> {
        await this.repo.markRead(notificationId, staffId);
    }

    async markAllRead(staffId: number): Promise<void> {
        await this.repo.markAllRead(staffId);
    }

    async getUnreadCount(staffId: number): Promise<number> {
        return this.repo.countUnread(staffId);
    }
}
