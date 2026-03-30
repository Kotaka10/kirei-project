import type { Request, Response } from "express";
import { fileService } from "../services/fileService.js";

export const upload = async (req: Request, res: Response) => {
    try {
        const result = await fileService.upload(req.file);
        res.status(201).json(result);
    } catch (e) {
        const message = e instanceof Error ? e.message : "アップロードに失敗しました";

        res.status(500).json({ message });
    }
}