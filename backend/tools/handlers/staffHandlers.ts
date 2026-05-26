import { Connection, type RowDataPacket } from "mysql2/promise";
import type { UserContext } from "../../types/auth.js";

export async function searchStaff(
    conn: Connection,
    args: { name?: string; role?: string },
    _ctx: UserContext
): Promise<object> {
    const params: any[] = [];
    const conditions: string[] = ["is_active = true"];

    if (args.name) {
        conditions.push("name LIKE ?");
        params.push(`%${args.name}%`);
    }
    if (args.role) {
        conditions.push("role = ?");
        params.push(args.role);
    }

    const [rows] = await conn.query<RowDataPacket[]>(
        `SELECT id, name, role FROM staffs WHERE ${conditions.join(" AND ")} ORDER BY name`,
        params
    );

    if (rows.length === 0) return { message: "該当するスタッフが見つかりませんでした" };
    return { staff_list: rows };
}

export async function findMatchingStaff(
    conn: Connection,
    args: { service_type: string; date?: string; booking_id?: number },
    _ctx: UserContext
): Promise<object> {
    const targetDate = args.date ?? new Date().toISOString().slice(0, 10);

    const [reqRows] = await conn.query<RowDataPacket[]>(
        `SELECT ssr.skill_id, s.name AS skill_name, ssr.required_level
         FROM service_skill_requirements ssr
         JOIN skills s ON ssr.skill_id = s.id
         WHERE ssr.service_type = ?`,
        [args.service_type]
    );

    if (reqRows.length === 0) {
        return { message: `「${args.service_type}」のスキル要件が未定義です。スタッフ全員が対応可能として扱います。` };
    }

    // 既に割り当て済みのスタッフIDを収集
    const assignedIds = new Set<number>();
    if (args.booking_id) {
        const [primaryRows] = await conn.query<RowDataPacket[]>(
            `SELECT staff_id FROM bookings WHERE id = ? AND staff_id IS NOT NULL`,
            [args.booking_id]
        );
        primaryRows.forEach(r => assignedIds.add(r.staff_id));

        const [additionalRows] = await conn.query<RowDataPacket[]>(
            `SELECT target_staff_id FROM assignment_requests
             WHERE booking_id = ? AND status != 'rejected'`,
            [args.booking_id]
        );
        additionalRows.forEach(r => assignedIds.add(r.target_staff_id));
    } else {
        // booking_id がない場合: date + service_type でジョブを特定して除外
        const bookingConditions = ["DATE(b.scheduled_at) = ?", "b.status != 'cancelled'"];
        const bookingParams: any[] = [targetDate];
        if (args.service_type) {
            bookingConditions.push("b.service_type LIKE ?");
            bookingParams.push(`%${args.service_type}%`);
        }

        const [bookingRows] = await conn.query<RowDataPacket[]>(
            `SELECT b.id, b.staff_id FROM bookings b WHERE ${bookingConditions.join(" AND ")}`,
            bookingParams
        );

        for (const b of bookingRows) {
            if (b.staff_id) assignedIds.add(b.staff_id);

            const [additionalRows] = await conn.query<RowDataPacket[]>(
                `SELECT target_staff_id FROM assignment_requests
                 WHERE booking_id = ? AND status != 'rejected'`,
                [b.id]
            );
            additionalRows.forEach(r => assignedIds.add(r.target_staff_id));
        }
    }

    const conditions = reqRows
        .map(() => `EXISTS (SELECT 1 FROM staff_skills ss WHERE ss.staff_id = st.id AND ss.skill_id = ? AND ss.level >= ?)`)
        .join(" AND ");
    const params: any[] = reqRows.flatMap(r => [r.skill_id, r.required_level]);

    const [staffRows] = await conn.query<RowDataPacket[]>(
        `SELECT st.id, st.name, st.role,
                ROUND(AVG(ss2.level), 1) AS avg_skill_level
         FROM staffs st
         JOIN staff_skills ss2 ON ss2.staff_id = st.id
                               AND ss2.skill_id IN (${reqRows.map(() => "?").join(",")})
         WHERE st.is_active = true AND ${conditions}
         GROUP BY st.id, st.name, st.role
         ORDER BY avg_skill_level DESC`,
        [...reqRows.map(r => r.skill_id), ...params]
    );

    const [availRows] = await conn.query<RowDataPacket[]>(
        `SELECT DISTINCT sc.staff_id
         FROM schedules sc
         WHERE sc.date = ? AND sc.status = 'available'`,
        [targetDate]
    );
    const availableIds = new Set(availRows.map(r => r.staff_id));

    const results = staffRows
        .filter(s => !assignedIds.has(s.id))
        .map(s => ({
            staff_id:        s.id,
            name:            s.name,
            role:            s.role,
            avg_skill_level: s.avg_skill_level,
            available:       availableIds.has(s.id),
        }));

    return {
        service_type:  args.service_type,
        date:          targetDate,
        requirements:  reqRows.map(r => ({ skill: r.skill_name, required_level: r.required_level })),
        matched_count: results.length,
        staff:         results,
        ...(assignedIds.size > 0 && { excluded_already_assigned: assignedIds.size }),
    };
}
