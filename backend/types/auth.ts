import { z } from "zod";

// ログインリクエスト
export const LoginRequestSchema = z.object({
    email:       z.string().email("正しいメールアドレスを入力してください"),
    password:    z.string().min(6, "パスワードは6文字以上です"),
});
export type LoginRequest = z.infer<typeof LoginRequestSchema>;

// JWTペイロード
export const JwtPayloadSchema = z.object({
    staff_id: z.number(),
    name:     z.string(),
    role:     z.enum(["cleaner", "technician", "supervisor"]),
    email:    z.string().email(),
})
export type JwtPayload = z.infer<typeof JwtPayloadSchema>;

export const UserContextSchema = z.object({
    staffId: z.number(),
    name:    z.string(),
    role:    z.enum(["cleaner", "technician", "supervisor"]),
});
export type UserContext = z.infer<typeof UserContextSchema>;

// Express ragにuserを追加
declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload;
        }
    }
}