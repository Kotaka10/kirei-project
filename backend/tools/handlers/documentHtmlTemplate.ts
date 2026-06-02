import { ISSUER } from "./documentShared.js";

export interface LineItem {
    description: string;
    qty?: number;
    unitPrice?: number;
    amount: number;
}

export interface Section {
    heading: string;
    items: { label: string; value: string }[];
}

export interface BuildDocHtmlParams {
    documentTitle:   string;
    documentNo:      string;
    issueDate:       string;
    customerName:    string;
    customerAddress?: string | undefined;
    issuerStaff:     string;
    validUntil?:     string | undefined;
    paymentDue?:     string | undefined;
    sections:        Section[];
    lineItems?:      LineItem[] | undefined;
    subtotal?:       number | undefined;
    taxAmount?:      number | undefined;
    totalAmount?:    number | undefined;
    bankInfo?:       string | undefined;
    notes?:          string | undefined;
}

export function escHtml(str: string | null | undefined): string {
    if (!str) return "";
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

export function buildDocumentHtml(params: BuildDocHtmlParams): string {
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
        ${params.notes ? `<div><div class="section h3" style="margin-top:16px"><h3>備考・特記事項</h3></div><div class="notes-box">${escHtml(params.notes)}</div></div>` : ""}
        ${params.bankInfo ? `<div><div class="section" style="margin-top:16px"><h3 style="background:#f4f4f4;padding:6px 12px;font-size:13px;font-weight:600;border-left:4px solid #3498db">お振込先</h3></div><div class="bank-box">${escHtml(params.bankInfo)}</div></div>` : ""}
        <div class="stamp-area">
            <div class="stamp-box">担当者印</div>
            <div class="stamp-box">承認印</div>
        </div>
    </div>
</body>
</html>`;
}