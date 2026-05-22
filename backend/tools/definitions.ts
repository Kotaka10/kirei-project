import type { ChatCompletionTool } from "openai/resources/index";

export const tools: ChatCompletionTool[] = [
    // 顧客の過去予約
    {
        type: "function",
        function: {
            name: "get_customer_bookings",
            description: "顧客名または顧客IDを元に、過去の予約履歴（サービス種別・日時・担当スタッフ・金額・ステータス）を返す",
            parameters: {
                type: "object",
                properties: {
                    customer_name: {
                        type: "string",
                        description: "顧客の名前（部分一致で検索）",
                    },
                    customer_id: {
                        type: "number",
                        description: "顧客ID（わかっている場合）",
                    },
                    limit: {
                        type: "number",
                        description: "取得件数（デフォルト5件）",
                    },
                },
                required: [],
            },
        },
    },

    //スタッフ空き確認
    {
    type: "function",
        function: {
            name: "check_staff_availability",
            description:
                "確認したい日付(YYYY-MM-DD)。「明日」「来週月曜」などの場合はシステムプロンプトの現在日時を基準に変換して渡すこと",
            parameters: {
                type: "object",
                properties: {
                    date: {
                        type: "string",
                        description: "確認したい日付（YYYY-MM-DD）。「明日」「来週月曜」などはAIが変換して渡す",
                    },
                    staff_name: {
                        type: "string",
                        description: "特定スタッフ名で絞る場合（省略可）",
                    },
                },
                required: ["date"],
            },
        },
    },

    // 今日・指定日のスケジュール
    {
        type: "function",
        function: {
            name: "get_schedule",
            description:
                "今日または指定した日の予約・スケジュール一覧を返す。明日」「来週月曜」などの場合はシステムプロンプトの現在日時を基準に変換して渡すこと。担当スタッフ・顧客名・サービス種別・時間が含まれる",
            parameters: {
                type: "object",
                properties: {
                    date: {
                        type: "string",
                        description: "確認したい日付（YYYY-MM-DD）。省略すると今日"
                    },
                },
                required: [],
            },
        },
    },

    // スタッフ検索
    {
        type: "function",
        function: {
            name: "search_staff",
            description: "スタッフ名や役職でスタッフ一覧を検索する。同僚の基本情報（名前・役職）を調べる際に使用。全ロールで利用可能",
            parameters: {
                type: "object",
                properties: {
                    name: {
                        type: "string",
                        description: "スタッフ名（部分一致）",
                    },
                    role: {
                        type: "string",
                        enum: ["cleaner", "technician", "supervisor"],
                        description: "役職で絞り込む場合（cleaner: 清掃員 / technician: 技術者 / supervisor: 管理者）",
                    },
                },
                required: [],
            },
        },
    },

    // 売上げ・昨対比
    {
        type: "function",
        function: {
            name: "get_sales_summary",
            description:
                "指定期間の売り上げ合計・件数を返す。月次の場合は昨年同月との比較（昨対比）も含む",
            parameters: {
                type: "object",
                properties: {
                    period: {
                        type: "string",
                        enum: ["today", "this_week", "this_month", "last_month"],
                        description: "集計期間"
                    },
                    year: {
                        type: "number",
                        description: "対象年（省略時は今年）",
                    },
                    month: {
                        type: "number",
                        description: "対象月 1〜12（period が this_month/last_month の場合に使用）",
                    },
                },
                required: ["period"],
            },
        },
    },
];