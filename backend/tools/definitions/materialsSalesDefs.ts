import type { ChatCompletionTool } from "openai/resources/index";

export const materialsSalesDefs: ChatCompletionTool[] = [
    // 仕事の持っていくものリスト（標準チェックリスト + 過去実績）
    {
        type: "function",
        function: {
            name: "get_job_materials",
            description:
                "サービス種別またはジョブIDに基づいて、仕事に必要な資材・ツールの持っていくものリストを返す。" +
                "標準チェックリストに加え、過去の同種ジョブで実際に使用された資材の実績（使用頻度・平均数量）も含む。" +
                "「○○清掃に何が必要？」「今日のジョブの持ち物は？」「過去の○○清掃では何を使った？」などに使用する。" +
                "booking_id が分かっている場合は必ず booking_id を渡すと顧客情報も含めて返せる。",
            parameters: {
                type: "object",
                properties: {
                    service_type: {
                        type: "string",
                        description: "サービス種別（例: エアコン清掃、浴室清掃）。部分一致で検索",
                    },
                    booking_id: {
                        type: "number",
                        description: "ジョブID。get_schedule などで判明している場合に指定すると顧客情報も返す",
                    },
                },
                required: [],
            },
        },
    },

    // 使用資材の記録
    {
        type: "function",
        function: {
            name: "record_job_materials",
            description:
                "ジョブ完了後に実際に使用した資材・道具を記録する。" +
                "「今日の仕事で○○を使った」「□□が必要だった」など使用実績を報告する際に使用する。" +
                "記録されたデータは次回の同種ジョブの持ち物提案に活用される。",
            parameters: {
                type: "object",
                properties: {
                    booking_id: {
                        type: "number",
                        description: "記録対象のジョブID。get_schedule などで判明している場合に指定",
                    },
                    materials: {
                        type: "array",
                        description: "使用した資材のリスト",
                        items: {
                            type: "object",
                            properties: {
                                name:  { type: "string", description: "資材名" },
                                qty:   { type: "number", description: "使用数量（省略時1）" },
                                notes: { type: "string", description: "メモ（省略可）。例: 汚れが激しかったため2本使用" },
                            },
                            required: ["name"],
                        },
                    },
                },
                required: ["booking_id", "materials"],
            },
        },
    },

    // 訪問見積もり概算
    {
        type: "function",
        function: {
            name: "estimate_visit_price",
            description:
                "現場情報（サービス種別・場所タイプ・面積・台数・汚れ度）をもとに概算料金レンジを算出する。" +
                "「エアコン10台でいくら？」「オフィスの定期清掃の概算は？」「汚れがひどいキッチンのクリーニング料金を教えて」などに使用。" +
                "save_estimate=true + customer_name を渡すと見積もり履歴として保存できる。",
            parameters: {
                type: "object",
                properties: {
                    service_type: {
                        type: "string",
                        description: "サービス種別（例: エアコン清掃、ハウスクリーニング、定期清掃）",
                    },
                    location_type: {
                        type: "string",
                        enum: ["戸建て", "マンション", "オフィス", "店舗"],
                        description: "現場の種別",
                    },
                    area_sqm: {
                        type: "number",
                        description: "面積（平米）。床ワックス・定期清掃・キッチン清掃などで使用",
                    },
                    unit_count: {
                        type: "number",
                        description: "台数・箇所数・部屋数。エアコン清掃・換気扇清掃・窓ガラス・ハウスクリーニングなどで使用",
                    },
                    dirty_level: {
                        type: "string",
                        enum: ["normal", "dirty", "very_dirty"],
                        description: "汚れ度。normal=通常 / dirty=汚れあり / very_dirty=ひどい汚れ",
                    },
                    customer_name: {
                        type: "string",
                        description: "顧客名（save_estimate=true の場合に記録される）",
                    },
                    save_estimate: {
                        type: "boolean",
                        description: "true にすると見積もり結果を履歴として保存する（customer_name が必要）",
                    },
                },
                required: ["service_type"],
            },
        },
    },

    // 営業トーク提案
    {
        type: "function",
        function: {
            name: "get_sales_talk_tips",
            description:
                "訪問見積もりの状況に応じた営業トーク・商談スクリプトを提案する。" +
                "「エアコン清掃の営業トークを教えて」「競合他社がいる場合の話し方は？」「予算が気になっているお客様へのクロージングは？」などに使用。" +
                "フェーズ（冒頭/ヒアリング/提案/クロージング）別に整理されたトークのコツが返ってくる。",
            parameters: {
                type: "object",
                properties: {
                    service_type: {
                        type: "string",
                        description: "サービス種別（例: エアコン清掃）。省略すると全サービス共通のトークが返る",
                    },
                    situation: {
                        type: "string",
                        enum: ["新規", "既存", "競合あり", "予算懸念あり", "全般"],
                        description: "商談の状況。省略すると全般のトークが返る",
                    },
                    talk_phase: {
                        type: "string",
                        enum: ["all", "opening", "discovery", "proposal", "closing"],
                        description: "取得したいフェーズ。all=全フェーズ（デフォルト）",
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
                        description: "集計期間",
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