import { Connection, type RowDataPacket } from "mysql2/promise";
import type { UserContext } from "../../types/auth.js";
import { TAX_RATE, formatDate, addDays, saveDocument, buildDocumentNo } from "./documentShared.js";
import { buildDocumentHtml, type LineItem } from "./documentHtmlTemplate.js";

export async function generateEstimateDocument(
    conn: Connection,
    args: {
        customer_name:     string;
        customer_address?: string;
        estimate_id?:      number;
        service_details?:  { service_type: string; description: string; amount: number }[];
        valid_days?:       number;
        notes?:            string;
    },
    ctx: UserContext
): Promise<object> {
    const issueDate  = formatDate(new Date());
    const validDays  = args.valid_days ?? 30;
    const validUntil = addDays(validDays);

    const [staffRows] = await conn.query<RowDataPacket[]>(
        "SELECT name FROM staffs WHERE id = ?",
        [ctx.staffId]
    );
    const staffName = staffRows[0]?.name ?? ctx.name;

    let estimateRow: RowDataPacket | null = null;
    if (args.estimate_id) {
        const [rows] = await conn.query<RowDataPacket[]>(
            "SELECT * FROM visit_estimates WHERE id = ?",
            [args.estimate_id]
        );
        estimateRow = rows[0] ?? null;
    }

    let lineItems: LineItem[] = [];
    if (args.service_details && args.service_details.length > 0) {
        lineItems = args.service_details.map(sd => ({
            description: sd.service_type + (sd.description ? `\n${sd.description}` : ""),
            amount:      sd.amount,
        }));
    } else if (estimateRow) {
        const mid = Math.round((Number(estimateRow.estimated_min) + Number(estimateRow.estimated_max)) / 2);
        lineItems = [{
            description: String(estimateRow.service_type) +
                (estimateRow.location_type ? `\n現場種別: ${estimateRow.location_type}` : "") +
                (estimateRow.area_sqm      ? ` / 面積: ${estimateRow.area_sqm}㎡` : "") +
                (estimateRow.unit_count    ? ` / ${estimateRow.unit_count}台` : ""),
            amount: mid,
        }];
    } else {
        return { error: "service_details または estimate_id を指定してください" };
    }

    const subtotal    = lineItems.reduce((s, it) => s + it.amount, 0);
    const taxAmount   = Math.round(subtotal * TAX_RATE);
    const totalAmount = subtotal + taxAmount;
    const tempNo      = `EST-TEMP-${Date.now()}`;

    const html = buildDocumentHtml({
        documentTitle:   "見 積 書",
        documentNo:      tempNo,
        issueDate,
        customerName:    args.customer_name,
        customerAddress: args.customer_address,
        issuerStaff:     staffName,
        validUntil,
        sections: [{
            heading: "見積情報",
            items: [
                { label: "お客様名",     value: args.customer_name },
                { label: "見積有効期限", value: validUntil },
                { label: "発行日",       value: issueDate },
                { label: "担当者",       value: staffName },
                ...(args.customer_address ? [{ label: "ご住所", value: args.customer_address }] : []),
            ],
        }],
        lineItems,
        subtotal,
        taxAmount,
        totalAmount,
        notes: args.notes ?? "※ 本見積書は概算金額です。現場確認後に正式見積もりを改めてご提示する場合があります。\n※ 上記金額は税込です（消費税10%含む）。",
    });

    const docId = await saveDocument(conn, {
        type:         "estimate",
        no:           tempNo,
        title:        `見積書 - ${args.customer_name}`,
        customerName: args.customer_name,
        estimateId:   args.estimate_id,
        html,
        totalAmount,
        issuedBy:     ctx.staffId,
        notes:        args.notes,
    });

    const finalNo   = buildDocumentNo("EST", docId);
    const finalHtml = html.replace(tempNo, finalNo);
    await conn.execute(
        "UPDATE documents SET document_no = ?, content_html = ?, status = 'issued' WHERE id = ?",
        [finalNo, finalHtml, docId]
    );

    return {
        success:       true,
        document_id:   docId,
        document_no:   finalNo,
        document_type: "見積書",
        customer_name: args.customer_name,
        total_amount:  totalAmount,
        valid_until:   validUntil,
        view_url:      `/api/documents/${docId}`,
        message:       `見積書を作成しました（書類番号: ${finalNo}）。合計金額: ${totalAmount.toLocaleString()}円（税込）。`,
    };
}