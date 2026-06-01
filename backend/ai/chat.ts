import OpenAI from "openai";
import { Connection } from "mysql2/promise";
import type { ChatCompletionMessageParam } from "openai/resources";
import { tools } from "../tools/definitions.js";
import { dispatchTool } from "../tools/dispatcher.js";
import { getAvailableServices } from "../tools/handlers/salesSupportHandlers.js";
import type { UserContext } from "../types/auth.js";
import dotenv from "dotenv";
dotenv.config();
 
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
 
function buildSystemPrompt(ctx: UserContext): string {
    const now = new Date();
    const today = now.toLocaleDateString("ja-JP", {
        year: "numeric", month: "2-digit", day: "2-digit", weekday: "short",
    });
    const time = now.toLocaleTimeString("ja-JP", {
        hour: "2-digit", minute: "2-digit",
    });
    
    const roleLabel = {
        cleaner:    "清掃員",
        technician: "技術者",
        supervisor: "管理者",
    }[ctx.role];
    
    return `あなたは清掃・メンテナンスサービス会社の社内AIアシスタントです。
    
    【現在日時】${today} ${time}（Asia/Tokyo）
    【ログインユーザー】${ctx.name}（staff_id: ${ctx.staffId} / ${roleLabel}）
    
    重要なルール:
    - 「今日」「明日」「今週」などの日付は必ず上記の現在日時を基準に計算すること
    - 「自分の」「私の」「今日のスケジュール」などの質問は staff_id: ${ctx.staffId} のデータを対象にすること
    - 「今日のスケジュール」「自分の予定」などは自分(staff_id: ${ctx.staffId})のデータのみ返す
    - 「今日以降の予約」「これからの予定」→ start_date=今日のみ渡す（end_date は不要）
    - 「今月の予約」→ start_date=今日, end_date=今月末 で渡す
    - 「5月の予約」など特定月 → start_date=その月1日, end_date=その月末日 で渡す
    - 「エアコン清掃のスケジュール」など業務種別を聞かれたら get_schedule に service_type を渡す
    - 「予約済み」「予約一覧」を聞かれたら get_schedule に status="booked" を渡す
    - 「スタッフのスケジュール」「スタッフの予定」「今日の予定一覧」など予定一覧を聞かれたら get_schedule を使用する
    - 「○○さんの予定」「○○さんのスケジュール」など特定スタッフの予定を聞かれたら get_schedule に staff_name を渡す
    - 「○○さんの来月の予約済みスケジュール」など特定スタッフ×特定月の予約を聞かれたら staff_name・start_date(月初)・end_date(月末)・status="booked" をセットで渡す
    - 「来月」→ 翌月1日を start_date、翌月末日を end_date として計算する（現在日時から正確に算出すること）
    - 「6月」など特定月 → その月の1日を start_date、末日を end_date として渡す
    - check_staff_availability は「○○日に空いているスタッフは？」など空き枠の確認に特化して使用する（スケジュール一覧には使わない）
    - スタッフの空き状況(check_staff_availability)は全ロールが全スタッフ分を参照可能
    - 「○○に△△さんを追加して」「○○のジョブに××を割り振りたい」など、ジョブへのスタッフ追加を依頼されたら request_staff_assignment を使用する
    - スタッフ追加リクエストは全ロールが送信可能だが、管理者の承認が必要であることを必ず伝える
    - 同じ日に複数のジョブがある場合、AIがサービス種別や顧客名で絞り込んで特定すること
    - 「○○のジョブに適したスタッフは？」「このジョブに誰が合う？」など特定ジョブについて find_matching_staff を使う場合、get_schedule などで booking_id が判明していれば必ず booking_id を渡すこと（既アサイン済みスタッフが除外される）
    - 「○○さんの過去の仕事は？」「顧客△△の予約履歴」「○○さんへの過去のサービス内容を教えて」など特定顧客の仕事・作業履歴を聞かれたら get_customer_bookings を使用する
    - 「何を持っていけばいい？」「今日のジョブの資材リストは？」「○○清掃に必要なものを教えて」「過去の○○清掃では何を使った？」など資材・道具・持ち物を聞かれたら get_job_materials を使用する
    - get_job_materials は booking_id が分かっている場合は必ず booking_id を渡す（顧客情報も合わせて返せる）
    - レスポンスの historical_usage.frequently_used が過去の実績、extra_items が標準リストにない追加アイテムなので回答時に活用する
    - 「今日の仕事で○○を使った」「□□が必要だった」「使用資材を記録して」など実績の記録を依頼されたら record_job_materials を使用する
    - record_job_materials は booking_id が必須。分からない場合は先に get_schedule で確認してから記録する
    - 売上データは管理者(supervisor)のみ閲覧可能
    - 管理者(supervisor)はget_scheduleで全スタッフのスケジュールを閲覧可能

    【ノウハウ機能】
    - 「○○のコツを教えて」「○○の方法は？」「○○のやり方を教えて」「○○ノウハウを見せて」など作業の手順・テクニックを聞かれたら search_knowhow を使用する
    - search_knowhow は keyword（単語レベル）と category（サービス種別）を組み合わせて精度を高める。「エアコン清掃のカビのコツ」→ category=エアコン清掃, keyword=カビ
    - 「初級向けのノウハウは？」「初心者向けのコツは？」→ difficulty=beginner を指定する
    - 「このコツを保存して」「ノウハウを記録して」「覚えておいて」「メモしておいて」などを言われたら save_knowhow を使用する
    - save_knowhow を呼ぶ前にAIがユーザーの言葉を整理して title（簡潔なタイトル）と content（手順・詳細）に構造化すること。ユーザーの口語をそのまま title にしない
    - 「このノウハウ参考になった」「役に立った」「ありがとう」などでノウハウIDが文脈から分かる場合は mark_knowhow_helpful を使用する
    - search_knowhow の結果を回答する際は content を箇条書きに整形して見やすく提示する

    【営業支援機能】
    - 「○○清掃の概算は？」「見積もりを出して」「いくらになる？」など料金概算を聞かれたら estimate_visit_price を使用する
    - estimate_visit_price のパラメータ: service_type（必須）+ area_sqm か unit_count のどちらか + dirty_level（普通=normal/汚れあり=dirty/ひどい=very_dirty）
    - 「台数が不明」「面積が不明」の場合はAIが適切なデフォルト値で概算し、「台数・面積により変動します」と補足すること
    - dirty_level を明示されていない場合は normal で計算し、「汚れ度によって変動あり」と伝える
    - 「見積もりを記録したい」「保存して」と言われたら save_estimate=true + customer_name を渡す
    - 「営業トークを教えて」「商談でどう話す？」「訪問見積もりからこういう話をするといい？」などは get_sales_talk_tips を使用する
    - get_sales_talk_tips は service_type・situation（新規/既存/競合あり/予算懸念あり）・talk_phase を状況に合わせて渡す
    - 見積もり結果をもとに「この案件の営業トーク」を聞かれたら、概算結果のサービス種別を自動的に service_type に渡して get_sales_talk_tips を呼ぶ
    - 営業トークは4フェーズ（冒頭→ヒアリング→提案→クロージング）で構成される。フェーズを指定されない場合は全フェーズを返す

    【訪問見積もりフロー】
    このフローは「現場を見た後にAIに概算を出させる」ための手順である。
    ─ トリガーワード ─
    「訪問見積もりしてきた」「現場を見てきた」「下見してきた」「お客様先に行ってきた」
    「○○さんの現場を確認した」「現場調査してきた」など。
    ─ フロー手順 ─
    ① ユーザーが上記トリガーを発した場合、以下の4項目を確認する（まとめて一度に聞く）:
       - 必要なサービス種別（複数可。例: 浴室清掃・床清掃・レンジフード清掃）
       - 各サービスの規模（面積の場合は平米数、台数の場合は台数）
       - 汚れ具合（普通／汚れあり／ひどい汚れ）
       - お客様名（任意・記録に使用）
    ② 情報収集中に一部が不明な場合の対応:
       - 面積・台数が不明 → 一般的な値（床清掃=20平米、エアコン=1台）で仮計算し「実測値で再計算できます」と補足
       - 汚れ度が不明 → dirty（汚れあり）で計算し「汚れ度によって±20〜30%変動します」と補足
    ③ 必要情報が揃ったら（または仮値で計算可能な状態になったら）:
       「では現場情報をもとに概算します」と宣言し、
       全サービス分の estimate_visit_price を同時に（並列で）呼び出す。
       ※ サービスが3種類なら3つの estimate_visit_price を一度のレスポンスで呼び出すこと
    ④ 全サービスの結果が揃ったら、以下の形式で回答する:
       ・各サービスの概算（min〜max）を箇条書きで列挙
       ・最後に「合計概算: ○○円〜○○円」を明記
       ・お客様名がある場合は「記録しますか？」と案内（save_estimate=true + customer_name）

    回答は日本語で、データは箇条書きで見やすく整理してください。`;
}
 
// 会話の流れから次のアクション候補を 3 件生成する（失敗しても空配列を返す）
async function generateSuggestions(
    messages: ChatCompletionMessageParam[],
    availableServices: string[] = [],
): Promise<string[]> {
    const serviceHint = availableServices.length > 0
        ? `\n【対応サービス一覧】${availableServices.join("、")}\n` +
          "見積もり・概算・営業トーク関連の会話の場合、まだ触れていない他のサービスの概算や営業トークを積極的に提案に含めること。"
        : "";

    try {
        const res = await openai.chat.completions.create({
            model:       "gpt-4o-mini",
            messages: [
                ...messages.slice(-8), // 直近 8 件のみ渡してトークンを節約
                {
                    role:    "user",
                    content: "この会話の流れを踏まえ、ユーザーが次に聞きたいこと・やりたいことを3つ予測して短いボタンラベルで提案してください。" +
                             serviceHint +
                             "必ず以下のJSON形式のみで返してください（他のテキスト不要）: {\"suggestions\":[\"提案1\",\"提案2\",\"提案3\"]}。各提案は20文字以内の日本語。",
                },
            ],
            temperature:     0.6,
            max_tokens:      150,
            response_format: { type: "json_object" },
        });
        const text   = res.choices[0]?.message?.content ?? "{}";
        const parsed = JSON.parse(text) as { suggestions?: unknown };
        if (Array.isArray(parsed.suggestions)) {
            return (parsed.suggestions as unknown[])
                .filter((s): s is string => typeof s === "string")
                .slice(0, 3);
        }
        return [];
    } catch {
        return [];
    }
}

export async function chat(
    conn: Connection,
    userMessage: string,
    history: ChatCompletionMessageParam[],
    ctx: UserContext,
    onChunk: (delta: string) => void,
): Promise<{ reply: string; history: ChatCompletionMessageParam[]; assignmentRequested: boolean; suggestions: string[] }> {

    const messages: ChatCompletionMessageParam[] = [
        { role: "system", content: buildSystemPrompt(ctx) },
        ...history,
        { role: "user", content: userMessage },
    ];

    let assignmentRequested = false;
    let salesToolUsed = false; // estimate_visit_price / get_sales_talk_tips が呼ばれたら true
    const MAX_TOOL_ROUNDS = 5; // 訪問見積もりフローで複数サービスを並列処理できるよう拡張

    // ツール呼び出しループ（チェーン呼び出し対応）
    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
        const stream = await openai.chat.completions.create({
            model:       "gpt-4o-mini",
            messages,
            tools,
            tool_choice: "auto",
            temperature: 0,
            stream:      true,
        });

        let fullContent = "";
        const toolCallsMap = new Map<number, { id: string; name: string; arguments: string }>();

        for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta;

            if (delta?.content) {
                fullContent += delta.content;
                // round=0 はツール呼び出しなし確定後なのでリアルタイムにストリーミング
                // （OpenAI は content と tool_calls を同一レスポンスに混在させない）
                if (round === 0) onChunk(delta.content);
            }

            if (delta?.tool_calls) {
                for (const tc of delta.tool_calls) {
                    const existing = toolCallsMap.get(tc.index) ?? { id: "", name: "", arguments: "" };
                    toolCallsMap.set(tc.index, {
                        id:        existing.id + (tc.id ?? ""),
                        name:      existing.name + (tc.function?.name ?? ""),
                        arguments: existing.arguments + (tc.function?.arguments ?? ""),
                    });
                }
            }
        }

        const reconstructedToolCalls = [...toolCallsMap.entries()]
            .sort(([a], [b]) => a - b)
            .map(([_, tc]) => ({
                id:       tc.id,
                type:     "function" as const,
                function: { name: tc.name, arguments: tc.arguments },
            }));

        if (reconstructedToolCalls.length === 0) {
            if (round === 0) {
                // ツール不要の直接回答（for await 内で既にストリーミング済み）
                messages.push({ role: "assistant", content: fullContent });
                const availableServices = salesToolUsed ? await getAvailableServices(conn) : [];
                const suggestions = await generateSuggestions(messages, availableServices);
                return { reply: fullContent, history: messages.slice(1), assignmentRequested: false, suggestions };
            }
            // ツール実行後に追加ツール不要 → Step3で最終回答生成
            break;
        }

        messages.push({
            role:       "assistant",
            content:    null,
            tool_calls: reconstructedToolCalls,
        } as ChatCompletionMessageParam);

        for (const toolCall of reconstructedToolCalls) {
            const name = toolCall.function.name;
            const args = JSON.parse(toolCall.function.arguments);
            console.log(`[Tool][${ctx.name}][round${round + 1}] ${name}(${JSON.stringify(args)})`);

            const result = await dispatchTool(conn, name, args, ctx);

            if (name === "estimate_visit_price" || name === "get_sales_talk_tips") {
                salesToolUsed = true;
            }

            if (name === "request_staff_assignment") {
                try {
                    const parsed = JSON.parse(result);
                    if (parsed.success === true) assignmentRequested = true;
                } catch { /* ignore */ }
            }

            messages.push({
                role:         "tool",
                tool_call_id: toolCall.id,
                content:      result,
            });
        }
    }

    // Step3: 自然言語回答をストリーミング生成
    const step3Stream = await openai.chat.completions.create({
        model:       "gpt-4o-mini",
        messages,
        temperature: 0.5,
        stream:      true,
    });

    let finalContent = "";
    for await (const chunk of step3Stream) {
        const delta = chunk.choices[0]?.delta?.content ?? "";
        if (delta) {
            onChunk(delta);
            finalContent += delta;
        }
    }

    messages.push({ role: "assistant", content: finalContent } as ChatCompletionMessageParam);
    const availableServices = salesToolUsed ? await getAvailableServices(conn) : [];
    const suggestions = await generateSuggestions(messages, availableServices);
    return { reply: finalContent, history: messages.slice(1), assignmentRequested, suggestions };
}