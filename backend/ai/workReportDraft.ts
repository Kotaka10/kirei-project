import type { UserContext } from "../types/auth.js";

const REPORT_KEYWORDS = ["報告書", "作業報告", "完了報告"];
const DRAFT_KEYWORDS = [
    "下書き",
    "草案",
    "ドラフト",
    "たたき台",
    "本文案",
    "案だけ",
    "発行しない",
    "保存しない",
    "正式な書類発行はまだ行わない",
];

export function isWorkReportDraftRequest(message: string): boolean {
    return REPORT_KEYWORDS.some(keyword => message.includes(keyword)) &&
        DRAFT_KEYWORDS.some(keyword => message.includes(keyword));
}

export function buildWorkReportDraftPrompt(ctx: UserContext): string {
    return `あなたは清掃・メンテナンス会社の作業報告書下書き作成アシスタントです。

【絶対ルール】
- 今回は下書き作成のみ。書類生成ツール・DB保存・正式発行は行わない
- 入力情報が不足していても作成を拒否せず、不明な項目は「要確認」と記載する
- 案件詳細に書かれている内容は省略せず、作業報告として自然な文章に整理する
- 実施済みか未実施か断定できない内容は「実施予定」「確認予定」など断定を避ける
- 回答はMarkdownで、スタッフがそのまま編集できる完成度にする

【出力フォーマット】
# 作業報告書 下書き

## 基本情報
- 案件名:
- お客様名:
- 作業日:
- 作業場所:
- 担当者: ${ctx.name}
- サービス種別:

## 作業概要

## 実施内容
- 

## 使用資材・道具
- 

## 現場状況・気づき
- 

## 課題・追加対応
- 

## お客様への共有事項
- 

## 次回提案・メンテナンス目安
- 

## 要確認事項
- 

最後に「必要であれば、この下書きを正式な作業報告書として発行できます。」と短く添えてください。`;
}
