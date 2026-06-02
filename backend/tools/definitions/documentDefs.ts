import type { ChatCompletionTool } from "openai/resources/index";

export const documentDefs: ChatCompletionTool[] = [
    // 見積書生成
    {
        type: "function",
        function: {
            name: "generate_estimate_document",
            description:
                "現場訪問・下見の情報をもとに正式な見積書（PDF印刷対応）を作成してデータベースに保存する。" +
                "「見積書を作成して」「見積書を出して」「お客様に正式な見積もり書類を渡したい」「見積書を発行して」などに使用する。" +
                "estimate_visit_price で概算済みの場合は estimate_id を渡すと詳細データを自動取得できる。",
            parameters: {
                type: "object",
                properties: {
                    customer_name: {
                        type: "string",
                        description: "お客様（会社）名（必須）",
                    },
                    customer_address: {
                        type: "string",
                        description: "お客様の住所（任意）",
                    },
                    estimate_id: {
                        type: "number",
                        description: "過去に estimate_visit_price で保存した見積もりID。指定すると金額・サービス詳細を自動取得する",
                    },
                    service_details: {
                        type: "array",
                        description: "サービス明細（estimate_id がない場合に指定）",
                        items: {
                            type: "object",
                            properties: {
                                service_type: { type: "string", description: "サービス種別（例: エアコン清掃）" },
                                description:  { type: "string", description: "作業内容の詳細（任意）" },
                                amount:       { type: "number", description: "金額（税抜）" },
                            },
                            required: ["service_type", "amount"],
                        },
                    },
                    valid_days: {
                        type: "number",
                        description: "見積有効期間（日数、デフォルト30日）",
                    },
                    notes: {
                        type: "string",
                        description: "備考・特記事項（任意）",
                    },
                },
                required: ["customer_name"],
            },
        },
    },

    // 作業報告書生成
    {
        type: "function",
        function: {
            name: "generate_work_report",
            description:
                "案件完了後に作業報告書（PDF印刷対応）を作成してデータベースに保存する。" +
                "「作業報告書を作成して」「完了報告書を出して」「仕事が終わったので報告書を作りたい」" +
                "「案件完了の書類を作成して」「お客様に作業完了の報告書を渡したい」などに使用する。",
            parameters: {
                type: "object",
                properties: {
                    booking_id: {
                        type: "number",
                        description: "完了したジョブのID（必須）。get_schedule などで booking_id が分かっている場合は必ず渡す",
                    },
                    work_summary: {
                        type: "string",
                        description: "実施した作業の概要・内容（必須）。AIがユーザーの発言を整理して記述する",
                    },
                    issues_found: {
                        type: "string",
                        description: "作業中に発見した問題・課題（任意）",
                    },
                    recommendations: {
                        type: "string",
                        description: "今後の推奨事項・メンテナンスアドバイス（任意）",
                    },
                    next_visit_date: {
                        type: "string",
                        description: "次回訪問の推奨日（任意、例: 2026年9月頃）",
                    },
                },
                required: ["booking_id", "work_summary"],
            },
        },
    },

    // 請求書生成
    {
        type: "function",
        function: {
            name: "generate_invoice",
            description:
                "作業完了後に請求書（適格請求書/インボイス対応・PDF印刷対応）を作成してデータベースに保存する。" +
                "「請求書を作成して」「請求書を出して」「請求書を発行して」「お客様に請求したい」などに使用する。" +
                "booking_id または estimate_id がある場合は渡すと金額データを自動取得できる。",
            parameters: {
                type: "object",
                properties: {
                    customer_name: {
                        type: "string",
                        description: "請求先のお客様（会社）名（必須）",
                    },
                    customer_address: {
                        type: "string",
                        description: "請求先の住所（任意）",
                    },
                    booking_id: {
                        type: "number",
                        description: "対象ジョブID（任意）。指定すると作業内容・金額を自動取得する",
                    },
                    estimate_id: {
                        type: "number",
                        description: "見積もりID（任意）。booking_id がない場合に見積金額をもとに請求書を作成する",
                    },
                    line_items: {
                        type: "array",
                        description: "請求明細（booking_id・estimate_id がない場合に手動指定）",
                        items: {
                            type: "object",
                            properties: {
                                description: { type: "string", description: "品目・作業内容" },
                                amount:      { type: "number", description: "金額（税抜）" },
                            },
                            required: ["description", "amount"],
                        },
                    },
                    payment_due_days: {
                        type: "number",
                        description: "支払期限（日数、デフォルト30日）",
                    },
                    bank_info: {
                        type: "string",
                        description: "振込先情報（銀行名・支店名・口座番号など。任意）",
                    },
                    notes: {
                        type: "string",
                        description: "備考（任意）",
                    },
                },
                required: ["customer_name"],
            },
        },
    },
];