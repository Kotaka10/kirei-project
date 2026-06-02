import { Connection, type RowDataPacket } from "mysql2/promise";
import type { UserContext } from "../../types/auth.js";
import { ISSUER, TAX_RATE, formatDate, addDays, saveDocument, buildDocumentNo } from "./documentShared.js";
import { buildDocumentHtml, type LineItem } from "./documentHtmlTemplate.js";

export async function generateInvoice(
    conn: Connection,
    args: {
        customer_name:     string;
        customer_address?: string;
        booking_id?:       number;
        estimate_id?:      number;
        line_items?:       { description: string; amount: number }[];
        payment_due_days?: number;
        bank_info?:        string;
        notes?:            string;
    },
    ctx: UserContext
): Promise<object> {
    const issueDate  = formatDate(new Date());
    const paymentDue = addDays(args.payment_due_days ?? 30);

    const [staffRows] = await conn.query<RowDataPacket[]>(
        "SELECT name FROM staffs WHERE id = ?",
        [ctx.staffId]
    );
    const staffName = staffRows[0]?.name ?? ctx.name;

    const infoSection: { label: string; value: string }[] = [
        { label: "お客様名", value: args.customer_name },
        { label: "発行日",   value: issueDate },
        { label: "支払期限", value: paymentDue },
        { label: "担当者",   value: staffName },
        ...(args.customer_address ? [{ label: "ご住所", value: args.customer_address }] : []),
    ];

    let lineItems: LineItem[] = [];

    if (args.booking_id) {
        const [bookingRows] = await conn.query<RowDataPacket[]>(
            `SELECT b.service_type, b.scheduled_at, b.price, c.name AS customer_name
             FROM bookings b JOIN customers c ON b.customer_id = c.id
             WHERE b.id = ?`,
            [args.booking_id]
        );
        if (bookingRows.length === 0) {
            return { error: `booking_id: ${args.booking_id} のジョブが見つかりませんでした` };
        }
        const b = bookingRows[0]!;
        infoSection.push({ label: "対象作業日", value: formatDate(b.scheduled_at) });
        lineItems.push({
            description: String(b.service_type) + `\n（作業日: ${formatDate(b.scheduled_at)}）`,
            amount:      Number(b.price) || 0,
        });
    } else if (args.estimate_id) {
        const [estRows] = await conn.query<RowDataPacket[]>(
            "SELECT * FROM visit_estimates WHERE id = ?",
            [args.estimate_id]
        );
        if (estRows.length === 0) {
            return { error: `estimate_id: ${args.estimate_id} の見積もりが見つかりませんでした` };
        }
        const est = estRows[0]!;
        lineItems.push({
            description: String(est.service_type),
            amount:      Math.round((Number(est.estimated_min) + Number(est.estimated_max)) / 2),
        });
    } else if (args.line_items && args.line_items.length > 0) {
        lineItems = args.line_items.map(it => ({ description: it.description, amount: it.amount }));
    } else {
        return { error: "booking_id、estimate_id、または line_items のいずれかを指定してください" };
    }

    const subtotal    = lineItems.reduce((s, it) => s + it.amount, 0);
    const taxAmount   = Math.round(subtotal * TAX_RATE);
    const totalAmount = subtotal + taxAmount;
    const tempNo      = `INV-TEMP-${Date.now()}`;

    const html = buildDocumentHtml({
        documentTitle:   "請 求 書",
        documentNo:      tempNo,
        issueDate,
        customerName:    args.customer_name,
        customerAddress: args.customer_address,
        issuerStaff:     staffName,
        paymentDue,
        sections: [{ heading: "請求情報", items: infoSection }],
        lineItems,
        subtotal,
        taxAmount,
        totalAmount,
        bankInfo: args.bank_info ?? "※ お振込先は担当者よりご案内いたします。",
        notes:    args.notes ?? `お支払期限（${paymentDue}）までにお振込みください。\n本書類は適格請求書（インボイス）として利用可能です（登録番号: ${ISSUER.registrationNo}）。`,
    });

    const docId = await saveDocument(conn, {
        type:         "invoice",
        no:           tempNo,
        title:        `請求書 - ${args.customer_name}`,
        customerName: args.customer_name,
        bookingId:    args.booking_id,
        estimateId:   args.estimate_id,
        html,
        totalAmount,
        issuedBy:     ctx.staffId,
        notes:        args.notes,
    });

    const finalNo   = buildDocumentNo("INV", docId);
    const finalHtml = html.replace(tempNo, finalNo);
    await conn.execute(
        "UPDATE documents SET document_no = ?, content_html = ?, status = 'issued' WHERE id = ?",
        [finalNo, finalHtml, docId]
    );

    return {
        success:       true,
        document_id:   docId,
        document_no:   finalNo,
        document_type: "請求書",
        customer_name: args.customer_name,
        subtotal,
        tax_amount:    taxAmount,
        total_amount:  totalAmount,
        payment_due:   paymentDue,
        view_url:      `/api/documents/${docId}`,
        message:       `請求書を作成しました（書類番号: ${finalNo}）。請求金額: ${totalAmount.toLocaleString()}円（税込）、支払期限: ${paymentDue}。`,
    };
}