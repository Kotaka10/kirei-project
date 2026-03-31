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

export const getAllFiles = async (req: Request, res: Response) => {
    try {
        const files = await fileService.getAllFiles();
        res.status(200).json({files});
    } catch (e) {
        const message = e instanceof Error ? e.message : "ファイルの取得に失敗しました";
        res.status(500).json({message});
    }
}