import { Router } from "express";
import type { Request, Response } from "express";
import type { RowDataPacket } from "mysql2/promise";
import { authMiddleware } from "../middlewares/auth.js";
import { getConnection } from "../db/connection.js";

const router = Router();

// GET /api/documents/:id
// 書類の HTML を返す（認証必須）
router.get("/:id", authMiddleware, async (req: Request, res: Response): Promise<void> => {
    const id = parseInt(String(req.params["id"] ?? ""), 10); // 第二引数は10進数で表してと明記している
    if (isNaN(id) || id <= 0) {
        res.status(400).send("<p>無効な書類IDです</p>");
        return;
    }

    const conn = await getConnection();
    try {
        const [rows] = await conn.query<RowDataPacket[]>(
            "SELECT content_html, title, document_type FROM documents WHERE id = ?",
            [id]
        );
        if (rows.length === 0) {
            res.status(404).send("<p>書類が見つかりません</p>");
            return;
        }
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        res.send(rows[0]!.content_html as string);
    } catch (err: any) {
        console.error("[DocumentRoutes]", err);
        res.status(500).send("<p>書類の取得中にエラーが発生しました</p>");
    } finally {
        await conn.end();
    }
});

// GET /api/documents
// 書類一覧（認証必須・管理者向け）
router.get("/", authMiddleware, async (_req: Request, res: Response): Promise<void> => {
    const conn = await getConnection();
    try {
        const [rows] = await conn.query<RowDataPacket[]>(
            `SELECT id, document_type, document_no, title, customer_name,
                    total_amount, status, issued_at
             FROM documents
             ORDER BY issued_at DESC
             LIMIT 50`
        );
        res.json({ documents: rows });
    } catch (err: any) {
        console.error("[DocumentRoutes]", err);
        res.status(500).json({ error: "書類一覧の取得に失敗しました" });
    } finally {
        await conn.end();
    }
});

export default router;