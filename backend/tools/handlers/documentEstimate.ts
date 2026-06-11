import { Connection, type RowDataPacket } from "mysql2/promise";
import type { UserContext } from "../../types/auth.js";
import { TAX_RATE, formatDate, addDays, saveDocument, buildDocumentNo } from "./documentShared.js";
import { buildDocumentHtml, type LineItem } from "./documentHtmlTemplate.js";

interface EstimateServiceDetail {
    service_type: string;
    description?: string;
    amount: number;
    quantity?: number;
    unit?: string;
    unit_price?: number;
    calculation?: string;
}

export async function generateEstimateDocument(
    conn: Connection,
    args: {
        customer_name:     string;
        customer_address?: string;
        estimate_id?:      number;
        service_details?:  EstimateServiceDetail[];
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
        lineItems = args.service_details.map(buildLineItem); // mapが自動でbuildLineItemに引数を渡している
    } else if (estimateRow) {
        const mid = Math.round((Number(estimateRow.estimated_min) + Number(estimateRow.estimated_max)) / 2);
        lineItems = [{
            description: String(estimateRow.service_type) +
                (estimateRow.location_type ? `\n現場種別: ${estimateRow.location_type}` : "") +
                (estimateRow.area_sqm      ? ` / 面積: ${estimateRow.area_sqm}㎡` : "") +
                (estimateRow.unit_count    ? ` / ${estimateRow.unit_count}台` : "") +
                `\n概算レンジ: ${Number(estimateRow.estimated_min).toLocaleString()}円〜${Number(estimateRow.estimated_max).toLocaleString()}円` +
                (estimateRow.dirty_level ? `\n汚れ度: ${estimateRow.dirty_level}` : ""),
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
        sections: [
            {
                heading: "見積情報",
                items: [
                    { label: "お客様名",     value: args.customer_name },
                    { label: "見積有効期限", value: validUntil },
                    { label: "発行日",       value: issueDate },
                    { label: "担当者",       value: staffName },
                    ...(args.customer_address ? [{ label: "ご住所", value: args.customer_address }] : []),
                ],
            },
            {
                heading: "算出条件",
                items: buildConditionItems(args.service_details, estimateRow),
            },
        ],
        lineItems,
        subtotal,
        taxAmount,
        totalAmount,
        notes: args.notes ?? "※ 本見積書は概算金額です。現場確認後に正式見積もりを改めてご提示する場合があります。\n※ 明細金額は税抜、合計金額は消費税10%を含む税込金額です。",
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

function buildLineItem(detail: EstimateServiceDetail): LineItem {
    return {
        description: buildServiceDescription(detail),
        amount:      detail.amount,
        ...(detail.quantity != null ? { qty: detail.quantity } : {}),
        ...(detail.unit_price != null ? { unitPrice: detail.unit_price } : {}),
    };
}

function buildServiceDescription(detail: EstimateServiceDetail): string {
    const rows = [detail.service_type];
    if (detail.description) rows.push(detail.description);
    if (detail.quantity != null && detail.unit) rows.push(`数量: ${detail.quantity}${detail.unit}`);
    if (detail.unit_price != null) rows.push(`単価: ${detail.unit_price.toLocaleString()}円`);
    if (detail.calculation) rows.push(`算出: ${detail.calculation}`);
    return rows.join("\n");
}

function buildConditionItems(
    serviceDetails: EstimateServiceDetail[] | undefined,
    estimateRow: RowDataPacket | null,
): Array<{ label: string; value: string }> {
    if (serviceDetails && serviceDetails.length > 0) {
        return serviceDetails.map((detail, index) => ({
            label: `明細${index + 1}`,
            value: [
                detail.service_type,
                detail.quantity != null && detail.unit ? `${detail.quantity}${detail.unit}` : "",
                detail.unit_price != null ? `単価 ${detail.unit_price.toLocaleString()}円` : "",
                `金額 ${detail.amount.toLocaleString()}円`,
            ].filter(Boolean).join(" / "),
        }));
    }

    if (!estimateRow) return [{ label: "算出条件", value: "サービス明細をもとに算出" }];

    return [
        { label: "サービス種別", value: String(estimateRow.service_type) },
        ...(estimateRow.location_type ? [{ label: "現場種別", value: String(estimateRow.location_type) }] : []),
        ...(estimateRow.area_sqm ? [{ label: "面積", value: `${estimateRow.area_sqm}㎡` }] : []),
        ...(estimateRow.unit_count ? [{ label: "数量", value: `${estimateRow.unit_count}台` }] : []),
        ...(estimateRow.dirty_level ? [{ label: "汚れ度", value: String(estimateRow.dirty_level) }] : []),
        {
            label: "概算レンジ",
            value: `${Number(estimateRow.estimated_min).toLocaleString()}円〜${Number(estimateRow.estimated_max).toLocaleString()}円`,
        },
    ];
}
