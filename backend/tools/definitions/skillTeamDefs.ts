import type { ChatCompletionTool } from "openai/resources/index";

export const skillTeamDefs: ChatCompletionTool[] = [
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
];