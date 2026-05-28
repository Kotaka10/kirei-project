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

    // スキルマッチング: 仕事に適したスタッフを探す
    {
        type: "function",
        function: {
            name: "find_matching_staff",
            description: "指定したサービス種別に必要なスキルを満たし、かつ指定日に空きがあるスタッフを熟練度順で返す。「○○ができる人を教えて」「明日のエアコン清掃に誰が向いている？」などに使用。booking_id が分かっている場合は渡すと既にアサイン済みのスタッフを除外できる",
            parameters: {
                type: "object",
                properties: {
                    service_type: {
                        type: "string",
                        description: "サービス種別（例: エアコン清掃、定期清掃）",
                    },
                    date: {
                        type: "string",
                        description: "対象日（YYYY-MM-DD）。空き確認も同時に行う。省略時は今日",
                    },
                    booking_id: {
                        type: "number",
                        description: "ジョブID。get_schedule の結果から booking_id が分かっている場合に指定するとアサイン済みスタッフを除外して返す",
                    },
                },
                required: ["service_type"],
            },
        },
    },

    // スキルギャップ分析
    {
        type: "function",
        function: {
            name: "analyze_skill_gaps",
            description: "サービス種別ごとに対応できるスタッフ数を集計し、人材が不足しているサービスを特定する。supervisorのみ使用可能",
            parameters: {
                type: "object",
                properties: {
                    service_type: {
                        type: "string",
                        description: "特定のサービス種別だけ分析する場合に指定（省略時は全サービス）",
                    },
                },
                required: [],
            },
        },
    },

    // チーム編成提案
    {
        type: "function",
        function: {
            name: "suggest_team",
            description: "指定したサービス種別・日付・人数に対して最適なチーム編成を提案する。スキル充足度と空き状況を考慮する",
            parameters: {
                type: "object",
                properties: {
                    service_type: {
                        type: "string",
                        description: "サービス種別",
                    },
                    date: {
                        type: "string",
                        description: "対象日（YYYY-MM-DD）",
                    },
                    team_size: {
                        type: "number",
                        description: "必要な人数（デフォルト2）",
                    },
                },
                required: ["service_type", "date"],
            },
        },
    },

    // スタッフ追加リクエスト
    {
        type: "function",
        function: {
            name: "request_staff_assignment",
            description:
                "特定のジョブ（仕事）に新しいスタッフを追加するリクエストを送信する。全ロールが使用可能だが管理者の承認が必要。" +
                "「○○に△△さんを追加して」「○○のジョブに××を割り振りたい」などの依頼に使用する。",
            parameters: {
                type: "object",
                properties: {
                    date: {
                        type: "string",
                        description: "ジョブの日付（YYYY-MM-DD）。「今日」「明日」などはシステムプロンプトの現在日時を基準に変換して渡す",
                    },
                    target_staff_name: {
                        type: "string",
                        description: "追加したいスタッフの名前",
                    },
                    service_type: {
                        type: "string",
                        description: "サービス種別（例: エアコン清掃）。同じ日に複数ジョブがある場合に絞り込みに使う",
                    },
                    customer_name: {
                        type: "string",
                        description: "顧客名。同じ日・同じサービス種別が複数ある場合に絞り込みに使う",
                    },
                    booking_id: {
                        type: "number",
                        description: "ジョブID。get_schedule の結果から booking_id が分かっている場合に指定すると確実",
                    },
                    note: {
                        type: "string",
                        description: "追加理由やメモ（任意）",
                    },
                },
                required: ["date", "target_staff_name"],
            },
        },
    },

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