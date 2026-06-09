import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import { getConnection } from "../db/connection.js";
import type { CaseRecord, CaseNotificationRecord, NotifiedStaff } from "../types/case.js";

export class CaseRepository {
    async create(
        title: string,
        summary: string,
        document: string,
        requiredRoles: string[],
        requiredLevel: number,
        createdBy: number,
    ): Promise<number> {
        const conn = await getConnection();
        try {
            const [result] = await conn.query<ResultSetHeader>(
                `INSERT INTO cases (title, summary, document, required_roles, required_level, created_by)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [title, summary, document, JSON.stringify(requiredRoles), requiredLevel, createdBy],
            );
            return result.insertId;
        } finally {
            await conn.end();
        }
    }

    async findAll(): Promise<CaseRecord[]> {
        const conn = await getConnection();
        try {
            const [rows] = await conn.query<RowDataPacket[]>(
                `SELECT c.*, s.name AS created_by_name
                 FROM cases c
                 LEFT JOIN staffs s ON s.id = c.created_by
                 ORDER BY c.created_at DESC`,
            );
            return rows.map(r => ({
                ...r,
                required_roles: r.required_roles ?? null, // undefinedが来てもnullに意図的にしている ←undefinedだとエラーになるから
            })) as CaseRecord[];
        } finally {
            await conn.end();
        }
    }

    async findById(id: number): Promise<CaseRecord | null> {
        const conn = await getConnection();
        try {
            const [rows] = await conn.query<RowDataPacket[]>(
                `SELECT c.*, s.name AS created_by_name
                 FROM cases c
                 LEFT JOIN staffs s ON s.id = c.created_by
                 WHERE c.id = ?
                 LIMIT 1`,
                [id],
            );
            if (!rows[0]) return null;
            const r = rows[0];
            return {
                ...r,
                required_roles: r.required_roles ?? null,
            } as CaseRecord;
        } finally {
            await conn.end();
        }
    }

    async updateStatus(id: number, status: string): Promise<void> {
        const conn = await getConnection();
        try {
            await conn.query(
                "UPDATE cases SET status = ? WHERE id = ?",
                [status, id],
            );
        } finally {
            await conn.end();
        }
    }

    /**
     * 案件のレベル感に「適した」スタッフを抽出する。
     *   - スタッフのレベル = 保有スキルの最高レベル（staff_skills.level の最大値。未登録なら1扱い）
     *   - 案件レベルとの差が ±1 以内（適正レベル帯）のスタッフを対象にする
     *   - roles が指定されていれば、そのロールに絞り込む（空配列なら全ロール）
     */
    async findMatchingStaff(roles: string[], requiredLevel: number): Promise<NotifiedStaff[]> {
        const conn = await getConnection();
        try {
            const roleFilter =
                roles.length > 0
                    ? `AND s.role IN (${roles.map(() => "?").join(", ")})`
                    : "";
            const [rows] = await conn.query<RowDataPacket[]>(
                `SELECT s.id AS staff_id, s.name, s.role,
                        COALESCE(MAX(ss.level), 1) AS level
                 FROM staffs s
                 LEFT JOIN staff_skills ss ON ss.staff_id = s.id
                 WHERE s.is_active = true ${roleFilter}
                 GROUP BY s.id, s.name, s.role
                 HAVING ABS(COALESCE(MAX(ss.level), 1) - ?) <= 1`,
                [...roles, requiredLevel],
            );
            return rows as NotifiedStaff[];
        } finally {
            await conn.end();
        }
    }

    async createNotifications(caseId: number, staffIds: number[]): Promise<void> {
        if (staffIds.length === 0) return;
        const conn = await getConnection();
        try {
            const values = staffIds.map(sid => `(${caseId}, ${sid})`).join(", ");
            await conn.query(
                `INSERT IGNORE INTO case_notifications (case_id, staff_id) VALUES ${values}`,
            );
        } finally {
            await conn.end();
        }
    }

    async findNotificationsByStaff(staffId: number): Promise<CaseNotificationRecord[]> {
        const conn = await getConnection();
        try {
            const [rows] = await conn.query<RowDataPacket[]>(
                `SELECT cn.id, cn.case_id, cn.staff_id, cn.is_read, cn.created_at,
                        c.title AS case_title, c.summary AS case_summary,
                        c.status AS case_status, c.document AS case_document,
                        c.required_level AS case_required_level,
                        c.created_at AS case_created_at
                 FROM case_notifications cn
                 JOIN cases c ON c.id = cn.case_id
                 WHERE cn.staff_id = ?
                 ORDER BY cn.created_at DESC`,
                [staffId],
            );
            return rows as CaseNotificationRecord[];
        } finally {
            await conn.end();
        }
    }

    async markRead(notificationId: number, staffId: number): Promise<void> {
        const conn = await getConnection();
        try {
            await conn.query(
                "UPDATE case_notifications SET is_read = 1 WHERE id = ? AND staff_id = ?",
                [notificationId, staffId],
            );
        } finally {
            await conn.end();
        }
    }

    async markAllRead(staffId: number): Promise<void> {
        const conn = await getConnection();
        try {
            await conn.query(
                "UPDATE case_notifications SET is_read = 1 WHERE staff_id = ?",
                [staffId],
            );
        } finally {
            await conn.end();
        }
    }

    async countUnread(staffId: number): Promise<number> {
        const conn = await getConnection();
        try {
            const [rows] = await conn.query<RowDataPacket[]>(
                "SELECT COUNT(*) AS cnt FROM case_notifications WHERE staff_id = ? AND is_read = 0",
                [staffId],
            );
            return (rows[0]?.cnt as number) ?? 0;
        } finally {
            await conn.end();
        }
    }
}