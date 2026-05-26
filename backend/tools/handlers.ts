import { Connection, type RowDataPacket, type ResultSetHeader } from "mysql2/promise";
import type { UserContext } from "../types/auth.js";

// ① 顧客の過去予約
export async function getCustomerBookings(
    conn: Connection,
    args: { customer_name?: string; customer_id?: number; limit?: number },
    ctx: UserContext
): Promise<object> {
    const limit = args.limit ?? 5;
    const params: any[] = [];
    const conditions: string[] = [];

  // 顧客の絞り込み
    if (args.customer_id) {
        conditions.push("c.id = ?");
        params.push(args.customer_id);
    } else if (args.customer_name) {
        conditions.push("c.name LIKE ?");
        params.push(`%${args.customer_name}%`);
    } else {
        return { error: "customer_name または customer_id を指定してください" };
    }

    // 権限フィルター
    if (ctx.role !== "supervisor") {
        conditions.push("b.staff_id = ?");
        params.push(ctx.staffId);
    }

    const where = conditions.join(" AND ");

    const [rows] = await conn.query<RowDataPacket[]>(
        `SELECT
        c.name        AS customer_name,
        b.service_type,
        b.scheduled_at,
        b.status,
        b.price,
        s.name        AS staff_name
        FROM bookings b
        JOIN customers c ON b.customer_id = c.id
        LEFT JOIN staffs s ON b.staff_id = s.id
        WHERE ${where}
        ORDER BY b.scheduled_at DESC
        LIMIT ?`,
        [...params, limit]
    );

    if (rows.length === 0) return { message: "該当する予約履歴が見つかりませんでした" };
    return { bookings: rows };
}

// ② スタッフ空き確認
export async function checkStaffAvailability(
    conn: Connection,
    args: { date: string; staff_name?: string },
    _ctx: UserContext
): Promise<object> {
    // 祝日・繁忙期チェック
    const [holidayRows] = await conn.query<RowDataPacket[]>(
        `SELECT name, is_busy FROM holidays WHERE date = ?`,
        [args.date]
    );

    const params: any[] = [args.date];
    const conditions: string[] = ["sc.date = ?", "s.is_active = true"];

    // 全ロールが全スタッフの空き状況を参照可能
    // 特定スタッフ名で絞り込む場合のみフィルター
    if (args.staff_name) {
        conditions.push("s.name LIKE ?");
        params.push(`%${args.staff_name}%`);
    }

    const [slots] = await conn.query<RowDataPacket[]>(
        `SELECT
        s.name       AS staff_name,
        s.role,
        sc.start_time,
        sc.end_time,
        sc.status
        FROM schedules sc
        JOIN staffs s ON sc.staff_id = s.id
        WHERE ${conditions.join(" AND ")}
        ORDER BY s.name, sc.start_time`,
        params
    );

    const available = slots.filter((r) => r.status === "available");
    const booked    = slots.filter((r) => r.status === "booked");

    return {
        date:            args.date,
        holiday:         holidayRows[0] ?? null,
        available_count: available.length,
        available_slots: available,
        booked_count:    booked.length,
        booked_slots:    booked,
    };
}

// ③ スタッフ検索
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

// ④ スケジュール確認（1日・期間・サービス種別・ステータス対応）
export async function getSchedule(
    conn: Connection,
    args: { date?: string; start_date?: string; end_date?: string; service_type?: string; status?: string },
    ctx: UserContext
): Promise<object> {
    const today = new Date().toISOString().slice(0, 10);

    const params: any[] = [];
    const conditions: string[] = [];

    // 日付条件
    const isPeriod = !!(args.start_date && args.end_date);
    if (isPeriod) {
        // 開始・終了両方あり → BETWEEN
        conditions.push("sc.date BETWEEN ? AND ?");
        params.push(args.start_date, args.end_date);
    } else if (args.start_date) {
        // 開始のみ（end_date なし）→ 以降すべて
        conditions.push("sc.date >= ?");
        params.push(args.start_date);
    } else if (args.date) {
        // 特定1日
        conditions.push("sc.date = ?");
        params.push(args.date);
    } else if (args.status === "booked" || args.service_type) {
        // 予約済み or サービス種別で絞る場合 → 今日以降
        conditions.push("sc.date >= ?");
        params.push(today);
    } else {
        // 何も指定なし → 今日
        conditions.push("sc.date = ?");
        params.push(today);
    }

    // 権限フィルター: 自分のスケジュールのみ（supervisorは全スタッフ分）
    if (ctx.role !== "supervisor") {
        conditions.push("sc.staff_id = ?");
        params.push(ctx.staffId);
    }

    // サービス種別フィルター（bookingが存在する行のみ）
    if (args.service_type) {
        conditions.push("b.service_type LIKE ?");
        params.push(`%${args.service_type}%`);
    }

    // ステータスフィルター
    if (args.status) {
        conditions.push("sc.status = ?");
        params.push(args.status);
        if (args.status === "booked") {
            // bookingsテーブル側も scheduled のみ（cancelled/completed を除外）
            conditions.push("b.status = 'scheduled'");
        }
    } else if (args.service_type) {
        // サービス種別指定時はbookedのみ対象
        conditions.push("sc.status = 'booked'");
        conditions.push("b.status = 'scheduled'");
    }

    const [rows] = await conn.query<RowDataPacket[]>(
        `SELECT
        sc.date,
        sc.start_time,
        sc.end_time,
        sc.status,
        s.name        AS staff_name,
        s.role        AS staff_role,
        c.name        AS customer_name,
        b.id          AS booking_id,
        b.service_type,
        b.price
        FROM schedules sc
        JOIN staffs s   ON sc.staff_id  = s.id
        LEFT JOIN bookings b  ON sc.booking_id = b.id
        LEFT JOIN customers c ON b.customer_id = c.id
        WHERE ${conditions.join(" AND ")}
        ORDER BY sc.date, sc.start_time
        LIMIT 100`,
        params
    );

    // 単日のみ祝日を取得
    let holiday = null;
    if (!isPeriod) {
        const targetDate = args.date ?? today;
        const [holidayRows] = await conn.query<RowDataPacket[]>(
            "SELECT name, is_busy FROM holidays WHERE date = ?",
            [targetDate]
        );
        holiday = holidayRows[0] ?? null;
    }

    const dateLabel = isPeriod
        ? `${args.start_date} 〜 ${args.end_date}`
        : args.start_date
            ? `${args.start_date} 以降`
            : args.date
                ? args.date
                : (args.status === "booked" || args.service_type)
                    ? `${today} 以降`
                    : today;

    return {
        date:         dateLabel,
        viewer:       ctx.name,
        holiday,
        total:        rows.length,
        booked_count: rows.filter((r) => r.status === "booked").length,
        schedules:    rows,
    };
}

// ④ 売上・昨対比
export async function getSalesSummary(
    conn: Connection,
    args: { period: string; year?: number; month?: number },
    ctx: UserContext
): Promise<object> {
    // 権限チェック
    if (ctx.role !== "supervisor") {
        return { error: "売上データは管理者のみ閲覧できます" };
    }

    const now   = new Date();
    const year  = args.year  ?? now.getFullYear();
    const month = args.month ?? (now.getMonth() + 1);

    let dateCondition: string;
    switch (args.period) {
        case "today":
        dateCondition = `date = '${now.toISOString().slice(0, 10)}'`;
        break;
        case "this_week": {
        const monday = new Date(now);
        monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
        dateCondition = `date >= '${monday.toISOString().slice(0, 10)}'`;
        break;
        }
        case "this_month":
        dateCondition = `YEAR(date) = ${year} AND MONTH(date) = ${month}`;
        break;
        case "last_month": {
        const lm = month === 1 ? 12 : month - 1;
        const ly = month === 1 ? year - 1 : year;
        dateCondition = `YEAR(date) = ${ly} AND MONTH(date) = ${lm}`;
        break;
        }
        default:
        return { error: "不正なperiodです" };
    }

    const [current] = await conn.query<RowDataPacket[]>(
        `SELECT
        COALESCE(SUM(total_amount), 0)  AS total_amount,
        COALESCE(SUM(booking_count), 0) AS booking_count
        FROM sales WHERE ${dateCondition}`
    );

    let yoy = null;
    if (args.period === "this_month" || args.period === "last_month") {
        const targetMonth = args.period === "last_month" ? (month === 1 ? 12 : month - 1) : month;
        const targetYear  = args.period === "last_month" ? (month === 1 ? year - 1 : year) : year;

        const [prev] = await conn.query<RowDataPacket[]>(
        `SELECT COALESCE(SUM(total_amount), 0) AS total_amount
        FROM sales WHERE YEAR(date) = ? AND MONTH(date) = ?`,
        [targetYear - 1, targetMonth]
        );

        const curr = Number(current[0]?.total_amount);
        const pre  = Number(prev[0]?.total_amount);
        yoy = {
        prev_year_amount:  pre,
        yoy_ratio_percent: pre > 0 ? Math.round((curr / pre) * 100) : null,
        diff:              curr - pre,
        };
    }

    return {
        period:        args.period,
        total_amount:  Number(current[0]?.total_amount),
        booking_count: Number(current[0]?.booking_count),
        yoy,
    };
}

// ⑥ スキルマッチング: 仕事に適したスタッフを検索
export async function findMatchingStaff(
    conn: Connection,
    args: { service_type: string; date?: string },
    _ctx: UserContext
): Promise<object> {
    const targetDate = args.date ?? new Date().toISOString().slice(0, 10);

    // サービスに必要なスキルを取得
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

    // 要件を全て満たすスタッフを取得（各スキルのレベル条件をチェック）
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

    // 空き状況を確認
    const [availRows] = await conn.query<RowDataPacket[]>(
        `SELECT DISTINCT sc.staff_id
         FROM schedules sc
         WHERE sc.date = ? AND sc.status = 'available'`,
        [targetDate]
    );
    const availableIds = new Set(availRows.map(r => r.staff_id));

    const results = staffRows.map(s => ({
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
    };
}

// ⑦ スキルギャップ分析（supervisorのみ）
export async function analyzeSkillGaps(
    conn: Connection,
    args: { service_type?: string },
    ctx: UserContext
): Promise<object> {
    if (ctx.role !== "supervisor") {
        return { error: "スキルギャップ分析は管理者のみ閲覧できます" };
    }

    // 分析対象のサービス種別を取得
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
            service_type:    svc.service_type,
            capable_staff:   capable,
            total_staff:     totalStaff,
            coverage_percent: Math.round((capable / totalStaff) * 100),
            requirements:    reqRows.map(r => ({ skill: r.skill_name, required_level: r.required_level })),
            risk:            capable <= 2 ? "高" : capable <= 5 ? "中" : "低",
        };
    }));

    const results = analysis.filter(Boolean);
    results.sort((a, b) => (a!.capable_staff) - (b!.capable_staff));

    return { total_staff: totalStaff, service_analysis: results };
}

// ⑧ チーム編成提案（supervisorのみ）
export async function suggestTeam(
    conn: Connection,
    args: { service_type: string; date: string; team_size?: number },
    ctx: UserContext
): Promise<object> {
    if (ctx.role !== "supervisor") {
        return { error: "チーム編成提案は管理者のみ利用できます" };
    }

    const teamSize = args.team_size ?? 2;

    // サービス要件取得
    const [reqRows] = await conn.query<RowDataPacket[]>(
        `SELECT ssr.skill_id, s.name AS skill_name, ssr.required_level
         FROM service_skill_requirements ssr
         JOIN skills s ON ssr.skill_id = s.id
         WHERE ssr.service_type = ?`,
        [args.service_type]
    );

    // その日に空いているスタッフ × スキル情報を取得
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

    // スキルスコアを計算してソート
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

// ⑨ スタッフ追加リクエスト（全ロール / 管理者承認が必要）
export async function requestStaffAssignment(
    conn: Connection,
    args: {
        date:               string;
        target_staff_name:  string;
        service_type?:      string;
        customer_name?:     string;
        booking_id?:        number;
        note?:              string;
    },
    ctx: UserContext
): Promise<object> {
    // ① 追加対象スタッフを名前で検索
    const [staffRows] = await conn.query<RowDataPacket[]>(
        `SELECT id, name, role FROM staffs WHERE name LIKE ? AND is_active = true`,
        [`%${args.target_staff_name}%`]
    );
    if (staffRows.length === 0) {
        return { error: `「${args.target_staff_name}」に該当するスタッフが見つかりませんでした` };
    }
    if (staffRows.length > 1) {
        return {
            error:      "名前が複数のスタッフに一致しました。フルネームで指定してください",
            candidates: staffRows.map(s => s.name),
        };
    }
    const targetStaff = staffRows[0]!;

    // ② ジョブを特定
    let booking: RowDataPacket;
    if (args.booking_id) {
        const [rows] = await conn.query<RowDataPacket[]>(
            `SELECT b.id, b.service_type, b.scheduled_at, c.name AS customer_name
             FROM bookings b JOIN customers c ON b.customer_id = c.id
             WHERE b.id = ? AND b.status != 'cancelled'`,
            [args.booking_id]
        );
        if (rows.length === 0) {
            return { error: `booking_id: ${args.booking_id} のジョブが見つかりませんでした` };
        }
        booking = rows[0]!;
    } else {
        const conditions: string[] = ["DATE(b.scheduled_at) = ?", "b.status != 'cancelled'"];
        const params: any[] = [args.date];
        if (args.service_type)  { conditions.push("b.service_type LIKE ?"); params.push(`%${args.service_type}%`); }
        if (args.customer_name) { conditions.push("c.name LIKE ?");         params.push(`%${args.customer_name}%`); }

        const [rows] = await conn.query<RowDataPacket[]>(
            `SELECT b.id, b.service_type, b.scheduled_at, c.name AS customer_name
             FROM bookings b JOIN customers c ON b.customer_id = c.id
             WHERE ${conditions.join(" AND ")} ORDER BY b.scheduled_at`,
            params
        );
        if (rows.length === 0) {
            return { error: `${args.date}に該当するジョブが見つかりませんでした` };
        }
        if (rows.length > 1) {
            return {
                message: "複数のジョブが見つかりました。どのジョブに追加しますか？",
                jobs:    rows.map(b => ({
                    booking_id:    b.id,
                    service_type:  b.service_type,
                    customer_name: b.customer_name,
                    scheduled_at:  b.scheduled_at,
                })),
            };
        }
        booking = rows[0]!;
    }

    // ③ 重複チェック（担当スタッフ or 承認待ち・承認済みリクエスト）
    const [dupPrimary] = await conn.query<RowDataPacket[]>(
        `SELECT id FROM bookings WHERE id = ? AND staff_id = ?`,
        [booking.id, targetStaff.id]
    );
    const [dupRequest] = await conn.query<RowDataPacket[]>(
        `SELECT id FROM assignment_requests WHERE booking_id = ? AND target_staff_id = ? AND status != 'rejected'`,
        [booking.id, targetStaff.id]
    );
    if (dupPrimary.length > 0 || dupRequest.length > 0) {
        return { error: `${targetStaff.name}さんはすでにこのジョブに割り当て済みまたは承認待ちです` };
    }

    // ④ リクエスト作成
    const [result] = await conn.execute<ResultSetHeader>(
        `INSERT INTO assignment_requests (booking_id, target_staff_id, requested_by, note) VALUES (?, ?, ?, ?)`,
        [booking.id, targetStaff.id, ctx.staffId, args.note ?? null]
    );

    return {
        success:      true,
        request_id:   result.insertId,
        message:      `${targetStaff.name}さんを「${booking.service_type}」（${booking.customer_name}）に追加するリクエストを送信しました。管理者の承認後に正式割り当てとなります。`,
        target_staff: targetStaff.name,
        job:          booking.service_type,
        customer:     booking.customer_name,
        date:         args.date,
    };
}