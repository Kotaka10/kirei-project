import type { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/auth.service.js";

const authService = new AuthService();

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
    const authHeader = req.headers.authorization; // authorization取得
    if (!authHeader?.startsWith("Bearer ")) { //Bearer確認
        res.status(401).json({ error: "認証が必要です" });
        return;
    }

    try {
        const token = authHeader.slice(7); // token抽出
        const user  = authService.verifyToken(token); // tokenが本物か確認
        req.user    = user;
        next();
    } catch {
        res.status(401).json({ error: "トークンが無効または期限切れです" });
    }
}
