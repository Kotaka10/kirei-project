import { z } from "zod";

export const LoginRequestSchema = z.object({
    email:    z.string().email("正しいメールアドレスを入力してください"),
    password: z.string().min(6, "パスワードは6文字以上です"),
});
export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const AuthUserSchema = z.object({
    name:  z.string(),
    role:  z.enum(["cleaner", "technician", "supervisor"]),
    email: z.string().email(),
});
export type AuthUser = z.infer<typeof AuthUserSchema>;

export const LoginResponseSchema = z.object({
    token: z.string(),
    user:  AuthUserSchema,
});
export type LoginResponse = z.infer<typeof LoginResponseSchema>;
