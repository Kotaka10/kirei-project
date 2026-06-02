import type { ChatCompletionTool } from "openai/resources/index";

export const staffScheduleDefs: ChatCompletionTool[] = [
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

    // スタッフ空き確認
    {
        type: "function",
        function: {
            name: "check_staff_availability",
            description:
                "指定した日付に空き（available）のスタッフ一覧を返す。「○日に空いている人は？」「来週月曜に誰が空いてる？」など空き枠の確認に使用する。スケジュール一覧には使わずget_scheduleを使うこと",
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

    // スケジュール確認（1日・期間・サービス種別・スタッフ名対応）
    {
        type: "function",
        function: {
            name: "get_schedule",
            description:
                "指定した日・期間・サービス種別・スタッフ名の予約・スケジュール一覧を返す。" +
                "「今日」「明日」「来週月曜」など1日指定は date で渡す。" +
                "「今月」「今週」「来月」「6月」など期間指定は start_date と end_date をセットで渡す。" +
                "「エアコン清掃のスケジュール」など業務種別で絞る場合は service_type を指定する。" +
                "「予約済みの予定」を聞く場合は status=booked を指定する。" +
                "「○○さんの予定」など特定スタッフを指定する場合は staff_name を渡す。",
            parameters: {
                type: "object",
                properties: {
                    date: {
                        type: "string",
                        description: "1日指定（YYYY-MM-DD）。省略すると今日",
                    },
                    start_date: {
                        type: "string",
                        description: "検索開始日（YYYY-MM-DD）。end_date なしで渡すと「この日以降すべて」になる",
                    },
                    end_date: {
                        type: "string",
                        description: "検索終了日（YYYY-MM-DD）。start_date とセットで期間検索になる",
                    },
                    service_type: {
                        type: "string",
                        description: "サービス種別で絞り込む（例: エアコン清掃、キッチン清掃）。部分一致",
                    },
                    status: {
                        type: "string",
                        enum: ["booked", "available"],
                        description: "ステータスで絞り込む。「予約済み」を聞く場合は booked を指定",
                    },
                    staff_name: {
                        type: "string",
                        description: "特定スタッフ名で絞り込む（部分一致）。「○○さんの予定」など特定スタッフを聞く場合に指定する",
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
];