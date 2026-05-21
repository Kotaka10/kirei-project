import type { Request, Response } from "express";
import { AuthService } from "../services/auth.service.js";
import { LoginRequestSchema } from "../types/auth.js";

export class AuthController {
    private authService = new AuthService();

    login = async (req: Request, res: Response): Promise<void> => {
        const parsed = LoginRequestSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({
                error: parsed.error.issues[0]?.message ?? "入力が不正です",
            });
            return;
        }

        try {
            const result = await this.authService.login(
                parsed.data.email,
                parsed.data.password,
            );
            res.json(result);
        } catch (err: any) {
            const status = err.statusCode ?? 500;
            res.status(status).json({ error: err.message ?? "エラーが発生しました" });
        }
    };

    me = async (req: Request, res: Response): Promise<void> => {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith("Bearer ")) {
            res.status(401).json({ error: "未認証です" });
            return;
        }

        try {
            const token = authHeader.slice(7);
            const user = await this.authService.verifyToken(token);
            res.json({ user });
        } catch {
            res.status(401).json({ error: "トークンが無効です" });
        }
    }
}