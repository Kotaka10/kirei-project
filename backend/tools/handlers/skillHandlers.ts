import { Connection, type RowDataPacket } from "mysql2/promise";
import type { UserContext } from "../../types/auth.js";

export async function analyzeSkillGaps(
    conn: Connection,
    args: { service_type?: string },
    ctx: UserContext
): Promise<object> {
    if (ctx.role !== "supervisor") {
        return { error: "スキルギャップ分析は管理者のみ閲覧できます" };
    }

    const [serviceRows] = await conn.query<RowDataPacket[]>(
        `SELECT DISTINCT service_type FROM service_skill_requirements
         ${args.service_type ? "WHERE service_type = ?" : "ORDER BY service_type"}`,
        args.service_type ? [args.service_type] : []
    );

    const totalStaff = await (async () => {
        const [r] = await conn.query<RowDataPacket[]>("SELECT COUNT(*) AS cnt FROM staffs WHERE is_active = true");
        return Number(r[0]?.cnt ?? 0);
    })();

    const analysis = await Promise.all(serviceRows.map(async (svc) => {
        const [reqRows] = await conn.query<RowDataPacket[]>(
            `SELECT ssr.skill_id, s.name AS skill_name, ssr.required_level
             FROM service_skill_requirements ssr
             JOIN skills s ON ssr.skill_id = s.id
             WHERE ssr.service_type = ?`,
            [svc.service_type]
        );
        if (reqRows.length === 0) return null;

        const conditions = reqRows
            .map(() => `EXISTS (SELECT 1 FROM staff_skills ss WHERE ss.staff_id = st.id AND ss.skill_id = ? AND ss.level >= ?)`)
            .join(" AND ");
        const params: any[] = reqRows.flatMap(r => [r.skill_id, r.required_level]);

        const [countRows] = await conn.query<RowDataPacket[]>(
            `SELECT COUNT(DISTINCT st.id) AS cnt
             FROM staffs st WHERE st.is_active = true AND ${conditions}`,
            params
        );
        const capable = Number(countRows[0]?.cnt ?? 0);

        return {
            service_type:     svc.service_type,
            capable_staff:    capable,
            total_staff:      totalStaff,
            coverage_percent: Math.round((capable / totalStaff) * 100),
            requirements:     reqRows.map(r => ({ skill: r.skill_name, required_level: r.required_level })),
            risk:             capable <= 2 ? "高" : capable <= 5 ? "中" : "低",
        };
    }));

    const results = analysis.filter(Boolean);
    results.sort((a, b) => (a!.capable_staff) - (b!.capable_staff));

    return { total_staff: totalStaff, service_analysis: results };
}

export async function suggestTeam(
    conn: Connection,
    args: { service_type: string; date: string; team_size?: number },
    ctx: UserContext
): Promise<object> {
    if (ctx.role !== "supervisor") {
        return { error: "チーム編成提案は管理者のみ利用できます" };
    }

    const teamSize = args.team_size ?? 2;

    const [reqRows] = await conn.query<RowDataPacket[]>(
        `SELECT ssr.skill_id, s.name AS skill_name, ssr.required_level
         FROM service_skill_requirements ssr
         JOIN skills s ON ssr.skill_id = s.id
         WHERE ssr.service_type = ?`,
        [args.service_type]
    );

    const [candidates] = await conn.query<RowDataPacket[]>(
        `SELECT DISTINCT st.id, st.name, st.role,
                JSON_ARRAYAGG(JSON_OBJECT('skill_id', ss.skill_id, 'skill_name', sk.name, 'level', ss.level)) AS skills_json
         FROM staffs st
         JOIN staff_skills ss ON ss.staff_id = st.id
         JOIN skills sk ON sk.id = ss.skill_id
         WHERE st.is_active = true
           AND EXISTS (SELECT 1 FROM schedules sc WHERE sc.staff_id = st.id AND sc.date = ? AND sc.status = 'available')
         GROUP BY st.id, st.name, st.role`,
        [args.date]
    );

    if (candidates.length === 0) {
        return { message: `${args.date} に空きのあるスタッフが見つかりませんでした` };
    }

    const scored = candidates.map(c => {
        let skills: { skill_id: number; skill_name: string; level: number }[] = [];
        try { skills = JSON.parse(c.skills_json as string); } catch { skills = []; }

        const score = reqRows.reduce((sum, req) => {
            const match = skills.find(s => s.skill_id === req.skill_id);
            return sum + (match ? Math.min(match.level / req.required_level, 1) : 0);
        }, 0);

        return { id: c.id, name: c.name, role: c.role, skills, score };
    }).sort((a, b) => b.score - a.score);

    const team = scored.slice(0, teamSize);
    const skillCoverage = reqRows.map(req => {
        const best = team.reduce((max, m) => {
            const s = m.skills.find(sk => sk.skill_id === req.skill_id);
            return s ? Math.max(max, s.level) : max;
        }, 0);
        return { skill: req.skill_name, required: req.required_level, covered_by_team: best, ok: best >= req.required_level };
    });

    return {
        service_type:   args.service_type,
        date:           args.date,
        team_size:      teamSize,
        proposed_team:  team.map(m => ({ staff_id: m.id, name: m.name, role: m.role, match_score: Math.round(m.score * 100) / 100 })),
        skill_coverage: skillCoverage,
        all_covered:    skillCoverage.every(s => s.ok),
    };
}
