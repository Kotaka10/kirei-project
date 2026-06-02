import type { ChatCompletionTool } from "openai/resources/index";

export const knowledgeDefs: ChatCompletionTool[] = [
    // ノウハウ検索
    {
        type: "function",
        function: {
            name: "search_knowhow",
            description:
                "仕事のノウハウ・コツ・手順をキーワードやカテゴリで検索して返す。" +
                "「エアコン清掃のコツを教えて」「油汚れの落とし方は？」「カビ除去の方法を知りたい」「初級レベルのノウハウは？」など" +
                "作業手順・やり方・テクニックを聞かれたら必ずこのツールを使用する。" +
                "全スタッフが利用可能。",
            parameters: {
                type: "object",
                properties: {
                    keyword: {
                        type: "string",
                        description: "検索キーワード（タイトル・内容・タグを横断検索）。例: カビ、油汚れ、フィルター",
                    },
                    category: {
                        type: "string",
                        description: "サービス種別・カテゴリで絞り込む。例: エアコン清掃、浴室清掃、キッチン清掃",
                    },
                    difficulty: {
                        type: "string",
                        enum: ["beginner", "intermediate", "advanced"],
                        description: "難易度で絞り込む。beginner=初級 / intermediate=中級 / advanced=上級",
                    },
                    limit: {
                        type: "number",
                        description: "取得件数（デフォルト5件、最大10件）",
                    },
                },
                required: [],
            },
        },
    },

    // ノウハウ保存
    {
        type: "function",
        function: {
            name: "save_knowhow",
            description:
                "仕事のノウハウ・コツ・作業手順をデータベースに保存する。" +
                "「このコツを保存して」「ノウハウを記録して」「覚えておいて」など保存・記録の依頼に使用する。" +
                "保存する前にAIがユーザーの発言を整理し、title（簡潔なタイトル）とcontent（詳細内容）に構造化してから呼び出す。" +
                "全スタッフが利用可能。",
            parameters: {
                type: "object",
                properties: {
                    title: {
                        type: "string",
                        description: "ノウハウの簡潔なタイトル（30文字以内が理想）",
                    },
                    content: {
                        type: "string",
                        description: "ノウハウの具体的な内容・手順（箇条書き形式が推奨）",
                    },
                    category: {
                        type: "string",
                        description: "サービス種別・業務カテゴリ（例: エアコン清掃）。全般は省略",
                    },
                    tags: {
                        type: "string",
                        description: "検索用タグ（カンマ区切り）。例: カビ,浴室,塩素",
                    },
                    difficulty: {
                        type: "string",
                        enum: ["beginner", "intermediate", "advanced"],
                        description: "難易度。beginner=初級 / intermediate=中級 / advanced=上級",
                    },
                },
                required: ["title", "content"],
            },
        },
    },

    // ノウハウ「参考になった」
    {
        type: "function",
        function: {
            name: "mark_knowhow_helpful",
            description:
                "ノウハウに「参考になった」を付ける。" +
                "「このノウハウ参考になった」「役に立った」など、特定ノウハウへの評価を記録する際に使用する。",
            parameters: {
                type: "object",
                properties: {
                    id: {
                        type: "number",
                        description: "ノウハウID（search_knowhow の結果から取得）",
                    },
                },
                required: ["id"],
            },
        },
    },

    // 資材購入リンク
    {
        type: "function",
        function: {
            name: "get_purchase_links",
            description:
                "資材・道具の名前をもとに、Amazon・楽天市場・MonotaRO・アスクル・Yahoo!ショッピングの購入検索URLを返す。" +
                "「○○はどこで買える？」「○○を購入したい」「○○の仕入れ先を教えて」「○○を注文したい」" +
                "「この資材を買いたい」などの購入・仕入れに関する質問に使用する。",
            parameters: {
                type: "object",
                properties: {
                    material_name: {
                        type: "string",
                        description: "購入したい資材・道具の名前（例: マイクロファイバークロス、ゴム手袋、洗濯槽クリーナー）",
                    },
                    quantity: {
                        type: "number",
                        description: "購入予定数量（省略可）。回答に「○○個を目安に」と補足するために使用",
                    },
                },
                required: ["material_name"],
            },
        },
    },
];