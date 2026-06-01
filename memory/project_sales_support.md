---
name: project-sales-support
description: 営業支援機能（訪問見積もり概算・営業トーク提案）の実装概要
metadata:
  type: project
---

2026-06-01に実装した営業支援AIチャット機能。

**Why:** 訪問見積もり時にAIがその場で概算を出せるようにし、営業トークの質を均一化するため。

**How to apply:** 新しいAIツールを2つ追加した。既存のツール追加パターンと同じ構成なので、次回ツール追加時も同じパターンに従う。

## 追加したAIツール

### `estimate_visit_price`
- **役割**: サービス種別・場所タイプ・台数/面積・汚れ度から概算金額レンジを算出
- **ハンドラー**: `backend/tools/handlers/salesSupportHandlers.ts`
- **DB参照**: `estimate_templates`（料金テンプレート）、`visit_estimates`（過去実績参考）
- **save_estimate=true + customer_name** で `visit_estimates` に記録保存

### `get_sales_talk_tips`
- **役割**: サービス種別・状況・フェーズに合わせた営業トークを提案
- **DB参照**: `sales_talk_tips`（28件のベストプラクティス）
- **フェーズ**: opening / discovery / proposal / closing の4段階

## 追加したDBテーブル

| テーブル | 件数 | 内容 |
|----------|------|------|
| `estimate_templates` | 8件 | サービス種別ごとの料金体系（基本料金・単位料金・汚れ係数） |
| `visit_estimates` | 10件 | 過去の訪問見積もり履歴ダミーデータ |
| `sales_talk_tips` | 28件 | 営業トークのベストプラクティス |

## 変更ファイル一覧

- `backend/tools/handlers/salesSupportHandlers.ts` (新規)
- `backend/tools/handlers.ts` (エクスポート追加)
- `backend/tools/definitions.ts` (2ツール定義追加)
- `backend/tools/dispatcher.ts` (2ケース追加)
- `backend/ai/chat.ts` (システムプロンプトに営業支援ルール追加)
- `frontend/src/features/ai/types/chatTypes.ts` (サジェスト質問更新)