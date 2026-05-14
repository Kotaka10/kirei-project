import { ChatCompletionTool } from "openai/resources/index";

export const tools: ChatCompletionTool[] = [
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
];