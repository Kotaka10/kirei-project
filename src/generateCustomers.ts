import OpenAI from "openai";
import dotenv from "dotenv";
import { Customer } from "./validate";

dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function generateCustomers(count: number) {
    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
            {
                role: "system",
                content: `あなたはダミーデータ生成の専門家です。
                必ずJSON形式のみで返答してください。
                {"customers": [...]} の形で返してください。
                前置きや説明は一切不要です。JSONのみ出力してください。`,
            },
            {
                role: "user",
                content: `日本企業の顧客ダミーデータを${count}件生成してください。
                各データに含めるフィールド:
                - id: 一意の数値ID
                - companyName: 日本企業名
                - zipcode: 郵便番号（例: "東京都"）
                - prefecture: 都道府県名
                - city: 市区町村名（例: "千代田区"）
                - otherAddress: 番地（例: "1-1-1"）
                - buildingName: ビル名（例: "千代田ビル3F"）
                - emails: メールアドレスの配列（例: ["info@example.co.jp"]）
                - phoneNumber: 携帯番号（090または080始まり、例: "090-1234-5678"）
                - contractDate: 契約日（例: "2024-01-01"）
                - status: "actibe" | "negotiating" | "cancelled" のいずれか
                - cancellationDate: statusがcancelledの場合は解約日、それ以外は空文字（例: "2024-12-01" or ""）

                リアルで多様なデータにしてください。`,
                
            },
        ],
    });

    const content = response.choices[0].message.content ?? "{}";
    const parsed = JSON.parse(content);

    return parsed.customers as Customer[];
}