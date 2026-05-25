import { type Connection, type RowDataPacket } from "mysql2/promise";
import type { Skill, StaffWithSkills, ServiceSkillRequirement } from "../types/indexTypes.js";

export class SkillRepository {
    /** 全スキルマスタ取得 */
    async findAllSkills(conn: Connection): Promise<Skill[]> {
        const [rows] = await conn.query<RowDataPacket[]>(
            "SELECT id, name, category, description FROM skills ORDER BY category, name"
        );
        return rows as Skill[];
    }

    /** 全スタッフのスキル一覧（staff_id 昇順） */
    async findAllStaffWithSkills(conn: Connection): Promise<StaffWithSkills[]> {
        const [staffRows] = await conn.query<RowDataPacket[]>(
            "SELECT id, name, role FROM staffs WHERE is_active = true ORDER BY id"
        );
        const [skillRows] = await conn.query<RowDataPacket[]>(
            `SELECT ss.staff_id, s.id AS skill_id, s.name AS skill_name,
                    s.category, ss.level, ss.acquired_at
             FROM staff_skills ss
             JOIN skills s ON ss.skill_id = s.id
             ORDER BY ss.staff_id, s.category, s.name`
        );

        return staffRows.map(st => ({
            id:     st.id,
            name:   st.name,
            role:   st.role,
            skills: skillRows
                .filter(sk => sk.staff_id === st.id)
                .map(sk => ({
                    skill_id:    sk.skill_id,
                    skill_name:  sk.skill_name,
                    category:    sk.category,
                    level:       sk.level,
                    acquired_at: sk.acquired_at,
                })),
        })) as StaffWithSkills[];
    }

    /** 特定スタッフのスキル取得 */
    async findSkillsByStaffId(conn: Connection, staffId: number): Promise<StaffWithSkills | null> {
        const [staffRows] = await conn.query<RowDataPacket[]>(
            "SELECT id, name, role FROM staffs WHERE id = ? AND is_active = true",
            [staffId]
        );
        if (staffRows.length === 0) return null;

        const [skillRows] = await conn.query<RowDataPacket[]>(
            `SELECT ss.staff_id, s.id AS skill_id, s.name AS skill_name,
                    s.category, ss.level, ss.acquired_at
             FROM staff_skills ss
             JOIN skills s ON ss.skill_id = s.id
             WHERE ss.staff_id = ?
             ORDER BY s.category, s.name`,
            [staffId]
        );
        const st = staffRows[0]!;
        return {
            id:     st.id,
            name:   st.name,
            role:   st.role,
            skills: skillRows.map(sk => ({
                skill_id:    sk.skill_id,
                skill_name:  sk.skill_name,
                category:    sk.category,
                level:       sk.level,
                acquired_at: sk.acquired_at,
            })),
        } as StaffWithSkills;
    }

    /** スタッフのスキルを一括更新（upsert） */
    async upsertStaffSkills(
        conn: Connection,
        staffId: number,
        skills: { skill_id: number; level: number }[]
    ): Promise<void> {
        await conn.query("DELETE FROM staff_skills WHERE staff_id = ?", [staffId]);
        if (skills.length === 0) return;
        const rows = skills.map(s => [staffId, s.skill_id, s.level, new Date()]);
        await conn.query(
            "INSERT INTO staff_skills (staff_id, skill_id, level, acquired_at) VALUES ?",
            [rows]
        );
    }

    /** サービス要件の全取得 */
    async findServiceRequirements(conn: Connection): Promise<ServiceSkillRequirement[]> {
        const [rows] = await conn.query<RowDataPacket[]>(
            `SELECT ssr.service_type, ssr.skill_id, s.name AS skill_name, ssr.required_level
             FROM service_skill_requirements ssr
             JOIN skills s ON ssr.skill_id = s.id
             ORDER BY ssr.service_type, ssr.required_level DESC`
        );
        return rows as ServiceSkillRequirement[];
    }
}
