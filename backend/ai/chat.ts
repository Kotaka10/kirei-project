import OpenAI from "openai";
import { Connection } from "mysql2/promise";
import type { ChatCompletionMessageParam } from "openai/resources";
import { tools } from "../tools/definitions.js";
import { dispatchTool } from "../tools/dispatcher.js";
import { getAvailableServices } from "../tools/handlers/salesEstimateHandlers.js";
import { buildSystemPrompt } from "./systemPrompt.js";
import { generateSuggestions } from "./suggestions.js";
import { isAllowedAiQuestion, OUT_OF_SCOPE_REPLY } from "./scopeGuard.js";
import { buildWorkReportDraftPrompt, isWorkReportDraftRequest } from "./workReportDraft.js";
import type { UserContext } from "../types/auth.js";
import dotenv from "dotenv";
dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function chat(
    conn: Connection,
    userMessage: string,
    history: ChatCompletionMessageParam[],
    ctx: UserContext,
    onChunk: (delta: string) => void,
): Promise<{ reply: string; history: ChatCompletionMessageParam[]; assignmentRequested: boolean; suggestions: string[] }> {

    const allowedQuestion = await isAllowedAiQuestion(openai, userMessage, history);
    if (!allowedQuestion) {
        onChunk(OUT_OF_SCOPE_REPLY);
        return {
            reply:               OUT_OF_SCOPE_REPLY,
            history:             [  
                ...history,
                { role: "user", content: userMessage },
                { role: "assistant", content: OUT_OF_SCOPE_REPLY },
            ],
            assignmentRequested: false,
            suggestions:         [],
        };
    }

    if (isWorkReportDraftRequest(userMessage)) {
        const messages: ChatCompletionMessageParam[] = [
            { role: "system", content: buildSystemPrompt(ctx) },
            { role: "system", content: buildWorkReportDraftPrompt(ctx) },
            ...history,
            { role: "user", content: userMessage },
        ];
        const stream = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages,
            temperature: 0.4,
            stream: true,
        });

        let fullContent = "";
        for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta?.content ?? "";
            if (delta) {
                fullContent += delta;
                onChunk(delta);
            }
        }

        messages.push({ role: "assistant", content: fullContent });
        const suggestions = await generateSuggestions(openai, messages, []);
        return { reply: fullContent, history: messages.slice(1), assignmentRequested: false, suggestions };
    }

    const messages: ChatCompletionMessageParam[] = [
        { role: "system", content: buildSystemPrompt(ctx) },
        ...history,
        { role: "user", content: userMessage },
    ];

    let assignmentRequested = false;
    let salesToolUsed       = false;
    const MAX_TOOL_ROUNDS   = 5;

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
                messages.push({ role: "assistant", content: fullContent });
                const availableServices = salesToolUsed ? await getAvailableServices(conn) : [];
                const suggestions = await generateSuggestions(openai, messages, availableServices);
                return { reply: fullContent, history: messages.slice(1), assignmentRequested: false, suggestions };
            }
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

            if (name === "estimate_visit_price" || name === "get_sales_talk_tips") salesToolUsed = true;
            if (name === "request_staff_assignment") {
                try {
                    if (JSON.parse(result).success === true) assignmentRequested = true;
                } catch { /* ignore */ }
            }

            messages.push({ role: "tool", tool_call_id: toolCall.id, content: result });
        }
    }

    const step3Stream = await openai.chat.completions.create({
        model: "gpt-4o-mini", messages, temperature: 0.5, stream: true,
    });

    let finalContent = "";
    for await (const chunk of step3Stream) {
        const delta = chunk.choices[0]?.delta?.content ?? "";
        if (delta) { onChunk(delta); finalContent += delta; }
    }

    messages.push({ role: "assistant", content: finalContent } as ChatCompletionMessageParam);
    const availableServices = salesToolUsed ? await getAvailableServices(conn) : [];
    const suggestions = await generateSuggestions(openai, messages, availableServices);
    return { reply: finalContent, history: messages.slice(1), assignmentRequested, suggestions };
}
