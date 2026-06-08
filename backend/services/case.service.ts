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
        // AIが案件タイトル・書類・適切なロールを生成
        const aiResult = await this.generateCaseDocument(summary);

        const caseId = await this.repo.create(
            aiResult.title,
            summary,
            aiResult.document,
            aiResult.requiredRoles,
            createdBy,
        );

        // 適切なスタッフを特定して通知
        let staffList: NotifiedStaff[];
        if (aiResult.requiredRoles.length > 0) {
            staffList = await this.repo.findStaffByRoles(aiResult.requiredRoles);
        } else {
            staffList = await this.repo.findAllActiveStaff();
        }

        // DB通知レコード作成
        await this.repo.createNotifications(caseId, staffList.map(s => s.staff_id));

        const push = await this.sendCasePushNotifications(caseId, aiResult.title, staffList);

        const created = await this.repo.findById(caseId);
        return { case: created!, notifiedStaff: staffList, push };
    }

    private async sendCasePushNotifications(
        caseId: number,
        title:  string,
        staffList: NotifiedStaff[],
    ): Promise<CasePushSummary> {
        const results = await Promise.allSettled( // 全員分の結果が出るまで待つメソッド Promise.all() → 即座に中断 Promise.allSettled() → 残りも続ける
            staffList.map(staff =>
                sendPushToUser({
                    externalId: `user-${staff.staff_id}`,
                    title: "新しい案件が登録されました",
                    body: title,
                    data: {
                        type: "case_created",
                        case_id: caseId,
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
  "requiredRoles": ["cleaner", "technician", "supervisor"] の中から必要なロールのみを配列で返す
}

- title: 案件の内容を端的に表すタイトル
- document: 800〜1500文字程度の詳細な案件書類（見出しを使った構造化された内容）
- requiredRoles: 案件に必要なスタッフのロール。cleaner（清掃員）・technician（技術者）・supervisor（監督者）から選択。
  複雑な案件は複数可。全員に通知したい場合は空配列 []`,
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
            };
        } catch {
            return {
                title: summary.slice(0, 30),
                document: summary,
                requiredRoles: [],
            };
        }
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
