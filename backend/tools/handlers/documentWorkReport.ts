import { Connection, type RowDataPacket } from "mysql2/promise";
import type { UserContext } from "../../types/auth.js";
import { formatDate, saveDocument, buildDocumentNo } from "./documentShared.js";
import { buildDocumentHtml } from "./documentHtmlTemplate.js";

type ResolveResult =
    | { bookingId: number }
    | { error: string; availableJobs?: object[] }
    | { candidates: object[] };

// =============================================
// booking_id が未指定のとき日付・種別・権限でDB自動検索
// supervisor → 全ジョブ対象 / その他 → 自分のアサインのみ
// =============================================
async function resolveBookingId(
    conn: Connection,
    ctx: UserContext,
    serviceType?: string,
    workDate?: string,
): Promise<ResolveResult> {
    const date         = workDate ?? new Date().toISOString().slice(0, 10);
    const isSupervisor = ctx.role === "supervisor";

    const baseConditions: string[] = [
        "DATE(b.scheduled_at) = ?",
        "b.status != 'cancelled'",
    ];
    const baseParams: unknown[] = [date];

    // supervisor 以外は自分のアサインのみ
    if (!isSupervisor) {
        baseConditions.push("sc.staff_id = ?");
        baseParams.push(ctx.staffId);
    }

    if (serviceType) {
        baseConditions.push("b.service_type LIKE ?");
        baseParams.push(`%${serviceType}%`);
    }

    const [rows] = await conn.query<RowDataPacket[]>(
        `SELECT b.id AS booking_id, b.service_type, b.scheduled_at, c.name AS customer_name
         FROM bookings b
         JOIN schedules sc ON sc.booking_id = b.id
         JOIN customers c  ON b.customer_id = c.id
         WHERE ${baseConditions.join(" AND ")}
         GROUP BY b.id
         ORDER BY b.scheduled_at`,
        baseParams,
    );

    if (rows.length === 0) {
        // サービス種別フィルタを外して候補一覧を返す（補足情報として）
        const fallbackConditions: string[] = [
            "DATE(b.scheduled_at) = ?",
            "b.status != 'cancelled'",
        ];
        const fallbackParams: unknown[] = [date];
        if (!isSupervisor) {
            fallbackConditions.push("sc.staff_id = ?");
            fallbackParams.push(ctx.staffId);
        }

        const [all] = await conn.query<RowDataPacket[]>(
            `SELECT b.id AS booking_id, b.service_type, b.scheduled_at, c.name AS customer_name
             FROM bookings b
             JOIN schedules sc ON sc.booking_id = b.id
             JOIN customers c  ON b.customer_id = c.id
             WHERE ${fallbackConditions.join(" AND ")}
             GROUP BY b.id
             ORDER BY b.scheduled_at`,
            fallbackParams,
        );

        if (all.length > 0 && serviceType) {
            return {
                error: `${date} の「${serviceType}」ジョブが見つかりませんでした。`,
                availableJobs: all.map(b => ({
                    booking_id:    b.booking_id,
                    service_type:  b.service_type,
                    customer_name: b.customer_name,
                    scheduled_at:  b.scheduled_at,
                })),
            };
        }

        const who = isSupervisor ? "" : "（あなたがアサインされた）";
        return { error: `${date} に${who}ジョブが見つかりませんでした。` };
    }

    if (rows.length > 1) {
        return {
            candidates: rows.map(b => ({
                booking_id:    b.booking_id,
                service_type:  b.service_type,
                customer_name: b.customer_name,
                scheduled_at:  b.scheduled_at,
            })),
        };
    }

    return { bookingId: rows[0]!.booking_id as number };
}

// =============================================
// booking_id を直接指定した場合の権限チェック
// supervisor → 制限なし / その他 → 担当確認
// =============================================
async function checkAuthorization(
    conn: Connection,
    bookingId: number,
    ctx: UserContext,
): Promise<{ authorized: true } | { authorized: false; error: string }> {
    if (ctx.role === "supervisor") {
        return { authorized: true };
    }

    const [rows] = await conn.query<RowDataPacket[]>(
        `SELECT id FROM schedules
         WHERE booking_id = ? AND staff_id = ? AND status = 'booked'
         LIMIT 1`,
        [bookingId, ctx.staffId],
    );

    if (rows.length === 0) {
        return {
            authorized: false,
            error: `booking_id: ${bookingId} はあなたのアサインジョブではないため、報告書を作成できません。`,
        };
    }

    return { authorized: true };
}

// =============================================
// 作業報告書生成（全ロール利用可・権限スコープ付き）
// =============================================
export async function generateWorkReport(
    conn: Connection,
    args: {
        booking_id?:      number;
        service_type?:    string;
        work_date?:       string;
        work_summary:     string;
        issues_found?:    string;
        recommendations?: string;
        next_visit_date?: string;
    },
    ctx: UserContext
): Promise<object> {
    let bookingId = args.booking_id;

    if (bookingId) {
        // booking_id 直接指定の場合は権限チェック
        const auth = await checkAuthorization(conn, bookingId, ctx);
        if (!auth.authorized) {
            return { error: auth.error };
        }
    } else {
        // 未指定の場合は日付・種別・権限で自動解決
        const resolved = await resolveBookingId(conn, ctx, args.service_type, args.work_date);

        if ("error" in resolved) {
            return {
                error:          resolved.error,
                available_jobs: resolved.availableJobs ?? [],
                hint:           "上記のジョブから booking_id を指定して再度お試しください。",
            };
        }
        if ("candidates" in resolved) {
            return {
                message:    "該当するジョブが複数あります。どのジョブの報告書を作成しますか？",
                candidates: resolved.candidates,
            };
        }
        bookingId = resolved.bookingId;
    }

    // 予約情報取得
    const [bookingRows] = await conn.query<RowDataPacket[]>(
        `SELECT b.id, b.service_type, b.scheduled_at, b.price, b.status,
                c.name AS customer_name
         FROM bookings b
         JOIN customers c ON b.customer_id = c.id
         WHERE b.id = ?`,
        [bookingId]
    );
    if (bookingRows.length === 0) {
        return { error: `booking_id: ${bookingId} のジョブが見つかりませんでした` };
    }
    const booking = bookingRows[0]!;

    const [staffRows] = await conn.query<RowDataPacket[]>(
        `SELECT s.name, s.role
         FROM schedules sc
         JOIN staffs s ON sc.staff_id = s.id
         WHERE sc.booking_id = ? AND sc.status = 'booked'`,
        [bookingId]
    );
    const staffList = staffRows.map(s => `${s.name}（${s.role}）`).join("、") || ctx.name;

    const [materialRows] = await conn.query<RowDataPacket[]>(
        `SELECT material_name, qty_used, notes
         FROM booking_materials
         WHERE booking_id = ?
         ORDER BY recorded_at`,
        [bookingId]
    );

    const issueDate     = formatDate(new Date());
    const workDate      = formatDate(booking.scheduled_at);
    const tempNo        = `RPT-TEMP-${Date.now()}`;
    const materialsText = materialRows.length > 0
        ? materialRows.map(m => `${m.material_name} × ${m.qty_used}${m.notes ? `（${m.notes}）` : ""}`).join("\n")
        : "記録なし";

    const html = buildDocumentHtml({
        documentTitle: "作 業 報 告 書",
        documentNo:    tempNo,
        issueDate,
        customerName:  String(booking.customer_name),
        issuerStaff:   ctx.name,
        sections: [
            {
                heading: "作業情報",
                items: [
                    { label: "お客様名",      value: String(booking.customer_name) },
                    { label: "サービス種別",   value: String(booking.service_type) },
                    { label: "作業日",        value: workDate },
                    { label: "担当スタッフ",  value: staffList },
                    { label: "作業ステータス", value: String(booking.status) },
                ],
            },
            {
                heading: "作業内容",
                items: [
                    { label: "実施作業概要", value: args.work_summary },
                    { label: "使用資材",     value: materialsText },
                    ...(args.issues_found    ? [{ label: "発見した課題",  value: args.issues_found }]    : []),
                    ...(args.recommendations ? [{ label: "推奨事項",      value: args.recommendations }] : []),
                    ...(args.next_visit_date ? [{ label: "次回推奨訪問日", value: args.next_visit_date }] : []),
                ],
            },
        ],
        notes: `本報告書は ${workDate} に実施した作業の完了報告です。\nご不明な点がございましたら担当者（${ctx.name}）までお問い合わせください。`,
    });

    const docId = await saveDocument(conn, {
        type:         "work_report",
        no:           tempNo,
        title:        `作業報告書 - ${booking.customer_name} / ${booking.service_type}`,
        customerName: String(booking.customer_name),
        bookingId:    bookingId,
        html,
        issuedBy:     ctx.staffId,
    });

    const finalNo   = buildDocumentNo("RPT", docId);
    const finalHtml = html.replace(tempNo, finalNo);
    await conn.execute(
        "UPDATE documents SET document_no = ?, content_html = ?, status = 'issued' WHERE id = ?",
        [finalNo, finalHtml, docId]
    );

    return {
        success:       true,
        document_id:   docId,
        document_no:   finalNo,
        document_type: "作業報告書",
        customer_name: String(booking.customer_name),
        service_type:  String(booking.service_type),
        work_date:     workDate,
        view_url:      `/api/documents/${docId}`,
        message:       `作業報告書を作成しました（書類番号: ${finalNo}）。作業日: ${workDate}、担当: ${ctx.name}。`,
    };
}