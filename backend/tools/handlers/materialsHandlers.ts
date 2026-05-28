import { Connection, type RowDataPacket, type ResultSetHeader } from "mysql2/promise";
import type { UserContext } from "../../types/auth.js";

// ─────────────────────────────────────────────────────────────
// get_job_materials
//   標準チェックリスト + 過去の同種ジョブ実績を返す
// ─────────────────────────────────────────────────────────────
export async function getJobMaterials(
    conn: Connection,
    args: { service_type?: string; booking_id?: number },
    _ctx: UserContext
): Promise<object> {
    let serviceType = args.service_type;
    let jobContext: Record<string, unknown> = {};

    // booking_id が指定されている場合は service_type を予約から取得
    if (args.booking_id) {
        const [bookingRows] = await conn.query<RowDataPacket[]>(
            `SELECT b.service_type, c.name AS customer_name, b.scheduled_at
             FROM bookings b
             JOIN customers c ON b.customer_id = c.id
             WHERE b.id = ?`,
            [args.booking_id]
        );
        if (bookingRows.length === 0) {
            return { error: `booking_id: ${args.booking_id} のジョブが見つかりませんでした` };
        }
        serviceType = String(bookingRows[0]!.service_type);
        jobContext  = {
            booking_id:    args.booking_id,
            customer_name: bookingRows[0]!.customer_name,
            scheduled_at:  bookingRows[0]!.scheduled_at,
        };
    }

    if (!serviceType) {
        return { error: "service_type または booking_id を指定してください" };
    }

    // 標準チェックリスト
    const standard = await fetchStandardList(conn, serviceType);

    // 過去の同種ジョブ実績
    const history = await fetchHistory(conn, serviceType, args.booking_id);

    if (!standard && history.total_past_jobs === 0) {
        return { message: `「${serviceType}」の資材情報が見つかりませんでした。` };
    }

    return {
        ...jobContext,
        service_type: serviceType,
        standard_checklist: standard ?? { required: [], optional: [], note: "標準リスト未登録" },
        historical_usage:   history,
    };
}

// 標準チェックリスト取得
async function fetchStandardList(conn: Connection, serviceType: string) {
    const [rows] = await conn.query<RowDataPacket[]>(
        `SELECT m.name, m.category, m.unit, sm.standard_quantity AS qty,
                sm.is_required, sm.notes
         FROM service_materials sm
         JOIN materials m ON sm.material_id = m.id
         WHERE sm.service_type = ? AND m.is_active = TRUE
         ORDER BY sm.is_required DESC, m.category, m.name`,
        [serviceType]
    );

    if (rows.length === 0) {
        // 部分一致で再検索
        const [fuzzy] = await conn.query<RowDataPacket[]>(
            `SELECT m.name, m.category, m.unit, sm.standard_quantity AS qty,
                    sm.is_required, sm.notes, sm.service_type AS matched_type
             FROM service_materials sm
             JOIN materials m ON sm.material_id = m.id
             WHERE sm.service_type LIKE ? AND m.is_active = TRUE
             ORDER BY sm.is_required DESC, m.category, m.name`,
            [`%${serviceType}%`]
        );
        if (fuzzy.length === 0) return null;
        return buildStandardResult(fuzzy);
    }
    return buildStandardResult(rows);
}

function buildStandardResult(rows: RowDataPacket[]) {
    const toItem = (r: RowDataPacket) => ({
        name:     r.name,
        category: r.category,
        qty:      Number(r.qty),
        unit:     r.unit,
        ...(r.notes ? { notes: r.notes } : {}),
    });
    return {
        required: rows.filter(r => r.is_required).map(toItem),
        optional: rows.filter(r => !r.is_required).map(toItem),
    };
}

// 過去の同種ジョブ実績取得
async function fetchHistory(conn: Connection, serviceType: string, excludeBookingId?: number) {
    const excludeClause = excludeBookingId ? "AND b.id != ?" : "";
    const params: unknown[] = [serviceType];
    if (excludeBookingId) params.push(excludeBookingId);

    // 過去ジョブ数
    const [countRows] = await conn.query<RowDataPacket[]>(
        `SELECT COUNT(DISTINCT bm.booking_id) AS cnt
         FROM booking_materials bm
         JOIN bookings b ON bm.booking_id = b.id
         WHERE b.service_type = ? AND b.scheduled_at < NOW() ${excludeClause}`,
        params
    );
    const totalPastJobs = Number(countRows[0]?.cnt ?? 0);

    if (totalPastJobs === 0) {
        return { total_past_jobs: 0, frequently_used: [], extra_items: [] };
    }

    // 使用頻度集計
    const [usageRows] = await conn.query<RowDataPacket[]>(
        `SELECT
            bm.material_name,
            COALESCE(m.category, 'その他') AS category,
            COALESCE(m.unit,     '個')     AS unit,
            COUNT(DISTINCT bm.booking_id)  AS job_count,
            ROUND(AVG(bm.qty_used), 1)     AS avg_qty,
            MAX(bm.notes)                  AS sample_note
         FROM booking_materials bm
         JOIN bookings b ON bm.booking_id = b.id
         LEFT JOIN materials m ON bm.material_id = m.id
         WHERE b.service_type = ? AND b.scheduled_at < NOW() ${excludeClause}
         GROUP BY bm.material_name, m.category, m.unit
         ORDER BY job_count DESC, bm.material_name
         LIMIT 20`,
        params
    );

    // 標準リストにない追加アイテム（実績のみに存在する）を抽出
    const [standardNames] = await conn.query<RowDataPacket[]>(
        `SELECT m.name
         FROM service_materials sm
         JOIN materials m ON sm.material_id = m.id
         WHERE sm.service_type = ?`,
        [serviceType]
    );
    const standardSet = new Set(standardNames.map(r => r.name as string));

    const frequentlyUsed = usageRows.map(r => ({
        name:          r.material_name,
        category:      r.category,
        unit:          r.unit,
        used_in_jobs:  Number(r.job_count),
        usage_rate:    `${Math.round((Number(r.job_count) / totalPastJobs) * 100)}%`,
        avg_qty:       Number(r.avg_qty),
        ...(r.sample_note ? { note: r.sample_note } : {}),
    }));

    const extraItems = frequentlyUsed.filter(r => !standardSet.has(r.name));

    return {
        total_past_jobs:  totalPastJobs,
        frequently_used:  frequentlyUsed,
        extra_items:      extraItems,
    };
}

// ─────────────────────────────────────────────────────────────
// record_job_materials
//   ジョブ完了後に実際に使用した資材を記録する
// ─────────────────────────────────────────────────────────────
export async function recordJobMaterials(
    conn: Connection,
    args: {
        booking_id: number;
        materials:  { name: string; qty?: number; notes?: string }[];
    },
    ctx: UserContext
): Promise<object> {
    if (!args.materials || args.materials.length === 0) {
        return { error: "記録する資材を1つ以上指定してください" };
    }

    // booking 存在確認
    const [bookingRows] = await conn.query<RowDataPacket[]>(
        `SELECT b.id, b.service_type, c.name AS customer_name
         FROM bookings b JOIN customers c ON b.customer_id = c.id
         WHERE b.id = ?`,
        [args.booking_id]
    );
    if (bookingRows.length === 0) {
        return { error: `booking_id: ${args.booking_id} のジョブが見つかりませんでした` };
    }
    const booking = bookingRows[0]!;

    // 資材名 → マスター ID のマップ
    const names = args.materials.map(m => m.name);
    const placeholders = names.map(() => "?").join(",");
    const [masterRows] = await conn.query<RowDataPacket[]>(
        `SELECT id, name FROM materials WHERE name IN (${placeholders})`,
        names
    );
    const nameToId = new Map<string, number>(masterRows.map(r => [r.name as string, r.id as number]));

    const recorded: string[] = [];
    const skipped:  string[] = [];

    for (const item of args.materials) {
        const materialId = nameToId.get(item.name) ?? null;
        const qty        = item.qty ?? 1;

        const [result] = await conn.query<ResultSetHeader>(
            `INSERT INTO booking_materials
             (booking_id, material_id, material_name, qty_used, notes, recorded_by)
             VALUES (?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
                 qty_used    = VALUES(qty_used),
                 notes       = VALUES(notes),
                 recorded_by = VALUES(recorded_by),
                 recorded_at = CURRENT_TIMESTAMP`,
            [args.booking_id, materialId, item.name, qty, item.notes ?? null, ctx.staffId]
        );

        if (result.affectedRows > 0) recorded.push(item.name);
        else skipped.push(item.name);
    }

    return {
        success:       true,
        booking_id:    args.booking_id,
        service_type:  booking.service_type,
        customer_name: booking.customer_name,
        recorded:      recorded,
        skipped:       skipped,
        message:       `「${booking.service_type}」（${booking.customer_name}）の使用資材 ${recorded.length} 件を記録しました。`,
    };
}
