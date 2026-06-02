import { Connection, type RowDataPacket } from "mysql2/promise";
import type { UserContext } from "../../types/auth.js";
import { formatDate, saveDocument, buildDocumentNo } from "./documentShared.js";
import { buildDocumentHtml } from "./documentHtmlTemplate.js";

export async function generateWorkReport(
    conn: Connection,
    args: {
        booking_id:       number;
        work_summary:     string;
        issues_found?:    string;
        recommendations?: string;
        next_visit_date?: string;
    },
    ctx: UserContext
): Promise<object> {
    const [bookingRows] = await conn.query<RowDataPacket[]>(
        `SELECT b.id, b.service_type, b.scheduled_at, b.price, b.status,
                c.name AS customer_name
         FROM bookings b
         JOIN customers c ON b.customer_id = c.id
         WHERE b.id = ?`,
        [args.booking_id]
    );
    if (bookingRows.length === 0) {
        return { error: `booking_id: ${args.booking_id} のジョブが見つかりませんでした` };
    }
    const booking = bookingRows[0]!;

    const [staffRows] = await conn.query<RowDataPacket[]>(
        `SELECT s.name, s.role
         FROM schedules sc
         JOIN staffs s ON sc.staff_id = s.id
         WHERE sc.booking_id = ? AND sc.status = 'booked'`,
        [args.booking_id]
    );
    const staffList = staffRows.map(s => `${s.name}（${s.role}）`).join("、") || ctx.name;

    const [materialRows] = await conn.query<RowDataPacket[]>(
        `SELECT material_name, qty_used, notes
         FROM booking_materials
         WHERE booking_id = ?
         ORDER BY recorded_at`,
        [args.booking_id]
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
        bookingId:    args.booking_id,
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