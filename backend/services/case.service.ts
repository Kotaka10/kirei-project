import { CaseRepository } from "../repositories/caseRepository.js";
import { sendPushToUser } from "./notificationService.js";
import { CaseAiService } from "./caseAi.service.js";
import type { CasePushSummary, CaseRecord, CaseNotificationRecord, NotifiedStaff } from "../types/case.js";

export class CaseService {
    private readonly repo = new CaseRepository();
    private readonly ai   = new CaseAiService();

    async createCase(
        summary: string,
        createdBy: number,
    ): Promise<{ case: CaseRecord; notifiedStaff: NotifiedStaff[]; push: CasePushSummary }> {
        // AIが案件タイトル・書類・適切なロール・難易度レベルを生成
        const aiResult = await this.ai.buildCaseDraft(summary);

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
