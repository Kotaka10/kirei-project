import OpenAI from "openai";
import { Connection } from "mysql2/promise";
import type { ChatCompletionMessageParam } from "openai/resources";
import { tools } from "../tools/definitions.js";
import { dispatchTool } from "../tools/dispatcher.js";
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
    - check_staff_availability は「○○日に空いているスタッフは？」など空き枠の確認に特化して使用する（スケジュール一覧には使わない）
    - スタッフの空き状況(check_staff_availability)は全ロールが全スタッフ分を参照可能
    - 「○○に△△さんを追加して」「○○のジョブに××を割り振りたい」など、ジョブへのスタッフ追加を依頼されたら request_staff_assignment を使用する
    - スタッフ追加リクエストは全ロールが送信可能だが、管理者の承認が必要であることを必ず伝える
    - 同じ日に複数のジョブがある場合、AIがサービス種別や顧客名で絞り込んで特定すること
    - 「○○のジョブに適したスタッフは？」「このジョブに誰が合う？」など特定ジョブについて find_matching_staff を使う場合、get_schedule などで booking_id が判明していれば必ず booking_id を渡すこと（既アサイン済みスタッフが除外される）
    - 売上データは管理者(supervisor)のみ閲覧可能
    - 管理者(supervisor)はget_scheduleで全スタッフのスケジュールを閲覧可能
    
    回答は日本語で、データは箇条書きで見やすく整理してください。`;
}
 
export async function chat(
    conn: Connection,
    userMessage: string,
    history: ChatCompletionMessageParam[],
    ctx: UserContext  // ← ユーザーコンテキストを受け取る
): Promise<{ reply: string; history: ChatCompletionMessageParam[] }> {
 
    const messages: ChatCompletionMessageParam[] = [
        { role: "system", content: buildSystemPrompt(ctx) }, // 毎回新鮮な日時・ユーザー情報
        ...history,
        { role: "user", content: userMessage },
    ];
    
    // Step1: AIがツールを選択（ツール選択はブレないよう低め）
    const step1 = await openai.chat.completions.create({
        model:       "gpt-4o-mini",
        messages,
        tools,
        tool_choice: "auto",
        temperature: 0,
    });
    
    const aiMsg = step1.choices[0]?.message;
    if (!aiMsg) return { reply: "", history: messages.slice(1) };
    messages.push(aiMsg as ChatCompletionMessageParam);

    // ツール不要（一般Q&A）
    if (!aiMsg.tool_calls?.length) {
        return { reply: aiMsg.content ?? "", history: messages.slice(1) };
    }
    
    // Step2: ツール実行（UserContextを渡す）
    for (const toolCall of aiMsg.tool_calls) {
        if (toolCall.type !== "function") continue;
        const name   = toolCall.function.name;
        const args   = JSON.parse(toolCall.function.arguments);
        console.log(`[Tool][${ctx.name}] ${name}(${JSON.stringify(args)})`);
    
        const result = await dispatchTool(conn, name, args, ctx); 
    
        messages.push({
        role:         "tool",
        tool_call_id: toolCall.id,
        content:      result,
        });
    }
    
    // Step3: 自然言語で回答生成（表現に幅を持たせるため中程度）
    const step2 = await openai.chat.completions.create({
        model:       "gpt-4o-mini",
        messages,
        temperature: 0.5,
    });
    
    const finalMsg = step2.choices[0]?.message;
    if (finalMsg) messages.push(finalMsg as ChatCompletionMessageParam);

    return { reply: finalMsg?.content ?? "", history: messages.slice(1) };
}