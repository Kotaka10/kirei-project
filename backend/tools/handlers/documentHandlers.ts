import { Connection, type RowDataPacket, type ResultSetHeader } from "mysql2/promise";
import type { UserContext } from "../../types/auth.js";

// =============================================
// 発行会社情報（書類ヘッダー用）
// =============================================
const ISSUER = {
    name:       "株式会社キレイ",
    postal:     "〒100-0001",
    address:    "東京都千代田区大手町1-1-1",
    tel:        "03-0000-0000",
    email:      "info@kirei.co.jp",
    registrationNo: "T1234567890123", // 適格請求書発行事業者登録番号
};

const TAX_RATE = 0.10;

// =============================================
// 書類番号生成
// =============================================
function buildDocumentNo(type: "EST" | "RPT" | "INV", id: number): string {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    return `${type}-${today}-${String(id).padStart(4, "0")}`;
}

// =============================================
// 日付フォーマット
// =============================================
function formatDate(date: Date | string | null): string {
    if (!date) return "―";
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" });
}

function addDays(days: number): string {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return formatDate(d);
}

// =============================================
// HTML 書類テンプレート
// =============================================
interface LineItem {
    description: string;
    qty?: number;
    unitPrice?: number;
    amount: number;
}

interface Section {
    heading: string;
    items: { label: string; value: string }[];
}

function buildDocumentHtml(params: {
    documentTitle: string;
    documentNo: string;
    issueDate: string;
    customerName: string;
    customerAddress?: string | undefined;
    issuerStaff: string;
    validUntil?: string | undefined;
    paymentDue?: string | undefined;
    sections: Section[];
    lineItems?: LineItem[] | undefined;
    subtotal?: number | undefined;
    taxAmount?: number | undefined;
    totalAmount?: number | undefined;
    bankInfo?: string | undefined;
    notes?: string | undefined;
}): string {
    const lineItemsHtml = params.lineItems && params.lineItems.length > 0 ? `
        <table class="items-table">
            <thead>
                <tr>
                    <th style="width:50%">品目・作業内容</th>
                    <th class="num" style="width:10%">数量</th>
                    <th class="num" style="width:18%">単価</th>
                    <th class="num" style="width:22%">金額（税抜）</th>
                </tr>
            </thead>
            <tbody>
                ${params.lineItems.map(item => `
                <tr>
                    <td>${escHtml(item.description)}</td>
                    <td class="num">${item.qty != null ? item.qty : "―"}</td>
                    <td class="num">${item.unitPrice != null ? item.unitPrice.toLocaleString() + " 円" : "―"}</td>
                    <td class="num">${item.amount.toLocaleString()} 円</td>
                </tr>
                `).join("")}
            </tbody>
        </table>
        <div class="total-block">
            <table class="total-table">
                <tr><td>小計（税抜）</td><td>${(params.subtotal ?? 0).toLocaleString()} 円</td></tr>
                <tr><td>消費税（10%）</td><td>${(params.taxAmount ?? 0).toLocaleString()} 円</td></tr>
                <tr class="total-row"><td>合計金額（税込）</td><td>${(params.totalAmount ?? 0).toLocaleString()} 円</td></tr>
            </table>
        </div>
    ` : "";

    const sectionsHtml = params.sections.map(sec => `
        <div class="section">
            <h3>${escHtml(sec.heading)}</h3>
            <table class="info-table">
                ${sec.items.map(it => `
                <tr>
                    <th>${escHtml(it.label)}</th>
                    <td>${escHtml(it.value)}</td>
                </tr>
                `).join("")}
            </table>
        </div>
    `).join("");

    return `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escHtml(params.documentTitle)} - ${escHtml(params.documentNo)}</title>
    <style>
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Hiragino Kaku Gothic ProN','Meiryo',sans-serif;font-size:14px;color:#222;background:#f0f0f0}
        .page{max-width:820px;margin:24px auto;background:#fff;padding:44px;box-shadow:0 2px 12px rgba(0,0,0,.12);border-radius:4px}
        @media print{body{background:#fff}.page{box-shadow:none;margin:0;border-radius:0}.no-print{display:none!important}}
        .print-btn{display:inline-block;margin-bottom:18px;padding:10px 28px;background:#c0392b;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:14px;font-family:inherit}
        .print-btn:hover{background:#a93226}
        .header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #c0392b;padding-bottom:18px;margin-bottom:24px}
        .doc-title{font-size:26px;font-weight:700;color:#c0392b;letter-spacing:.05em}
        .issuer-info{text-align:right;font-size:12px;line-height:1.9;color:#444}
        .issuer-info strong{font-size:14px;color:#111}
        .meta{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:26px}
        .customer-block{flex:1}
        .customer-name{font-size:20px;font-weight:700;border-bottom:2px solid #333;padding-bottom:5px;margin-bottom:6px}
        .customer-address{font-size:13px;color:#555;margin-bottom:6px}
        .notice{color:#c0392b;font-weight:700;font-size:13px;margin-top:6px}
        .doc-info{text-align:right;font-size:13px;line-height:2.1;color:#444}
        .doc-info strong{color:#111}
        .section{margin-bottom:18px}
        .section h3{background:#f4f4f4;padding:6px 12px;font-size:13px;font-weight:600;border-left:4px solid #c0392b;margin-bottom:6px}
        .info-table{width:100%;border-collapse:collapse;font-size:13px}
        .info-table th{width:130px;padding:6px 10px;background:#fafafa;border:1px solid #ddd;text-align:left;font-weight:normal;color:#555}
        .info-table td{padding:6px 10px;border:1px solid #ddd;white-space:pre-wrap}
        .items-table{width:100%;border-collapse:collapse;font-size:13px;margin-top:16px}
        .items-table th{background:#c0392b;color:#fff;padding:8px 10px;text-align:left}
        .items-table th.num,.items-table td.num{text-align:right}
        .items-table td{padding:7px 10px;border-bottom:1px solid #eee}
        .items-table tr:nth-child(even) td{background:#fafafa}
        .total-block{display:flex;justify-content:flex-end;margin-top:12px}
        .total-table{border-collapse:collapse;font-size:14px;min-width:280px}
        .total-table td{padding:5px 15px;border:1px solid #ddd}
        .total-table td:last-child{text-align:right}
        .total-row td{background:#c0392b;color:#fff;font-weight:700;font-size:16px}
        .notes-box{margin-top:20px;padding:12px;background:#fffdf0;border:1px solid #e8d875;border-radius:4px;font-size:13px;white-space:pre-wrap}
        .bank-box{margin-top:12px;padding:12px;background:#f0f8ff;border:1px solid #a0c4e8;border-radius:4px;font-size:13px;white-space:pre-wrap}
        .stamp-area{margin-top:32px;display:flex;gap:20px;justify-content:flex-end}
        .stamp-box{border:1px solid #ccc;width:80px;height:80px;display:flex;align-items:center;justify-content:center;font-size:11px;color:#aaa}
        .reg-no{font-size:11px;color:#777;margin-top:4px}
    </style>
</head>
<body>
    <div class="page">
        <div class="no-print" style="text-align:center">
            <button class="print-btn" onclick="window.print()">🖨️ 印刷 / PDF で保存</button>
        </div>

        <div class="header">
            <div class="doc-title">${escHtml(params.documentTitle)}</div>
            <div class="issuer-info">
                <strong>${escHtml(ISSUER.name)}</strong><br>
                ${escHtml(ISSUER.postal)} ${escHtml(ISSUER.address)}<br>
                TEL: ${escHtml(ISSUER.tel)}<br>
                ${escHtml(ISSUER.email)}<br>
                <span class="reg-no">登録番号: ${escHtml(ISSUER.registrationNo)}</span>
            </div>
        </div>

        <div class="meta">
            <div class="customer-block">
                <div class="customer-name">${escHtml(params.customerName)} 御中</div>
                ${params.customerAddress ? `<div class="customer-address">${escHtml(params.customerAddress)}</div>` : ""}
                ${params.validUntil ? `<div class="notice">有効期限：${escHtml(params.validUntil)}</div>` : ""}
                ${params.paymentDue  ? `<div class="notice">お支払期限：${escHtml(params.paymentDue)}</div>` : ""}
            </div>
            <div class="doc-info">
                <strong>書類番号：</strong>${escHtml(params.documentNo)}<br>
                <strong>発行日：</strong>${escHtml(params.issueDate)}<br>
                <strong>担当者：</strong>${escHtml(params.issuerStaff)}<br>
            </div>
        </div>

        ${sectionsHtml}
        ${lineItemsHtml}

        ${params.notes ? `
        <div>
            <div class="section h3" style="margin-top:16px"><h3>備考・特記事項</h3></div>
            <div class="notes-box">${escHtml(params.notes)}</div>
        </div>` : ""}

        ${params.bankInfo ? `
        <div>
            <div class="section" style="margin-top:16px"><h3 style="background:#f4f4f4;padding:6px 12px;font-size:13px;font-weight:600;border-left:4px solid #3498db">お振込先</h3></div>
            <div class="bank-box">${escHtml(params.bankInfo)}</div>
        </div>` : ""}

        <div class="stamp-area">
            <div class="stamp-box">担当者印</div>
            <div class="stamp-box">承認印</div>
        </div>
    </div>
</body>
</html>`;
}

function escHtml(str: string | null | undefined): string {
    if (!str) return "";
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

// =============================================
// 書類保存 → ドキュメントIDを返す
// =============================================
async function saveDocument(
    conn: Connection,
    params: {
        type:         "estimate" | "work_report" | "invoice";
        no:           string;
        title:        string;
        customerName: string;
        bookingId?:   number | undefined;
        estimateId?:  number | undefined;
        html:         string;
        totalAmount?: number | undefined;
        issuedBy:     number;
        notes?:       string | undefined;
    }
): Promise<number> {
    const [result] = await conn.execute<ResultSetHeader>(
        `INSERT INTO documents
            (document_type, document_no, title, customer_name, booking_id, estimate_id,
             content_html, total_amount, issued_by, notes, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft')`,
        [
            params.type,
            params.no,
            params.title,
            params.customerName,
            params.bookingId  ?? null,
            params.estimateId ?? null,
            params.html,
            params.totalAmount ?? null,
            params.issuedBy,
            params.notes ?? null,
        ]
    );
    return result.insertId;
}

// =============================================
// 見積書生成
// =============================================
export async function generateEstimateDocument(
    conn: Connection,
    args: {
        customer_name:    string;
        customer_address?: string;
        estimate_id?:     number;
        service_details?: { service_type: string; description: string; amount: number }[];
        valid_days?:      number;
        notes?:           string;
    },
    ctx: UserContext
): Promise<object> {
    const issueDate  = formatDate(new Date());
    const validDays  = args.valid_days ?? 30;
    const validUntil = addDays(validDays);

    // 担当スタッフ名取得
    const [staffRows] = await conn.query<RowDataPacket[]>(
        "SELECT name FROM staffs WHERE id = ?",
        [ctx.staffId]
    );
    const staffName = staffRows[0]?.name ?? ctx.name;

    // 見積もり元データ取得（estimate_id が指定された場合）
    let estimateRow: RowDataPacket | null = null;
    if (args.estimate_id) {
        const [rows] = await conn.query<RowDataPacket[]>(
            "SELECT * FROM visit_estimates WHERE id = ?",
            [args.estimate_id]
        );
        estimateRow = rows[0] ?? null;
    }

    // 明細行を構築
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

    // 一時 ID でドキュメント番号を仮生成し、HTML生成後に確定 ID で上書き
    const tempNo = `EST-TEMP-${Date.now()}`;
    const html   = buildDocumentHtml({
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
                    { label: "お客様名",   value: args.customer_name },
                    { label: "見積有効期限", value: validUntil },
                    { label: "発行日",     value: issueDate },
                    { label: "担当者",     value: staffName },
                    ...(args.customer_address ? [{ label: "ご住所", value: args.customer_address }] : []),
                ],
            },
        ],
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

    // 確定番号で更新
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

// =============================================
// 作業報告書生成
// =============================================
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
    // 予約情報取得
    const [bookingRows] = await conn.query<RowDataPacket[]>(
        `SELECT b.id, b.service_type, b.scheduled_at, b.price, b.status,
                c.name AS customer_name, c.id AS customer_id
         FROM bookings b
         JOIN customers c ON b.customer_id = c.id
         WHERE b.id = ?`,
        [args.booking_id]
    );
    if (bookingRows.length === 0) {
        return { error: `booking_id: ${args.booking_id} のジョブが見つかりませんでした` };
    }
    const booking = bookingRows[0]!;

    // 担当スタッフ取得
    const [staffRows] = await conn.query<RowDataPacket[]>(
        `SELECT s.name, s.role
         FROM schedules sc
         JOIN staffs s ON sc.staff_id = s.id
         WHERE sc.booking_id = ? AND sc.status = 'booked'`,
        [args.booking_id]
    );
    const staffList = staffRows.map(s => `${s.name}（${s.role}）`).join("、") || ctx.name;

    // 使用資材取得
    const [materialRows] = await conn.query<RowDataPacket[]>(
        `SELECT material_name, qty_used, notes
         FROM booking_materials
         WHERE booking_id = ?
         ORDER BY recorded_at`,
        [args.booking_id]
    );

    const issueDate = formatDate(new Date());
    const workDate  = formatDate(booking.scheduled_at);
    const tempNo    = `RPT-TEMP-${Date.now()}`;

    const materialsText = materialRows.length > 0
        ? materialRows.map(m => `${m.material_name} × ${m.qty_used}${m.notes ? `（${m.notes}）` : ""}`).join("\n")
        : "記録なし";

    const html = buildDocumentHtml({
        documentTitle:   "作 業 報 告 書",
        documentNo:      tempNo,
        issueDate,
        customerName:    String(booking.customer_name),
        issuerStaff:     ctx.name,
        sections: [
            {
                heading: "作業情報",
                items: [
                    { label: "お客様名",     value: String(booking.customer_name) },
                    { label: "サービス種別",  value: String(booking.service_type) },
                    { label: "作業日",       value: workDate },
                    { label: "担当スタッフ", value: staffList },
                    { label: "作業ステータス", value: String(booking.status) },
                ],
            },
            {
                heading: "作業内容",
                items: [
                    { label: "実施作業概要", value: args.work_summary },
                    { label: "使用資材",     value: materialsText },
                    ...(args.issues_found ? [{ label: "発見した課題", value: args.issues_found }] : []),
                    ...(args.recommendations ? [{ label: "推奨事項", value: args.recommendations }] : []),
                    ...(args.next_visit_date ? [{ label: "次回推奨訪問日", value: args.next_visit_date }] : []),
                ],
            },
        ],
        notes: `本報告書は ${workDate} に実施した作業の完了報告です。\nご不明な点がございましたら担当者（${ctx.name}）までお問い合わせください。`,
    });

    const docId   = await saveDocument(conn, {
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

// =============================================
// 請求書生成
// =============================================
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
    const issueDate     = formatDate(new Date());
    const dueDays       = args.payment_due_days ?? 30;
    const paymentDue    = addDays(dueDays);

    // 担当スタッフ名取得
    const [staffRows] = await conn.query<RowDataPacket[]>(
        "SELECT name FROM staffs WHERE id = ?",
        [ctx.staffId]
    );
    const staffName = staffRows[0]?.name ?? ctx.name;

    // 明細行を構築
    let lineItems: LineItem[] = [];
    const infoSection: { label: string; value: string }[] = [
        { label: "お客様名",   value: args.customer_name },
        { label: "発行日",     value: issueDate },
        { label: "支払期限",   value: paymentDue },
        { label: "担当者",     value: staffName },
        ...(args.customer_address ? [{ label: "ご住所", value: args.customer_address }] : []),
    ];

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
        const mid  = Math.round((Number(est.estimated_min) + Number(est.estimated_max)) / 2);
        lineItems.push({
            description: String(est.service_type),
            amount:      mid,
        });
    } else if (args.line_items && args.line_items.length > 0) {
        lineItems = args.line_items.map(it => ({
            description: it.description,
            amount:      it.amount,
        }));
    } else {
        return { error: "booking_id、estimate_id、または line_items のいずれかを指定してください" };
    }

    const subtotal    = lineItems.reduce((s, it) => s + it.amount, 0);
    const taxAmount   = Math.round(subtotal * TAX_RATE);
    const totalAmount = subtotal + taxAmount;

    const tempNo = `INV-TEMP-${Date.now()}`;
    const html   = buildDocumentHtml({
        documentTitle:   "請 求 書",
        documentNo:      tempNo,
        issueDate,
        customerName:    args.customer_name,
        customerAddress: args.customer_address,
        issuerStaff:     staffName,
        paymentDue,
        sections: [
            { heading: "請求情報", items: infoSection },
        ],
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