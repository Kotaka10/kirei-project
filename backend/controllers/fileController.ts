import type { Request, Response } from "express";
import { fileService } from "../services/fileService.js";

export const upload = async (req: Request, res: Response) => {
    try {
        // HTTPリクエストヘッダーから元のファイル名を取り出している　multipart/form-dataならファイル名は取れるけどBlobやBase64で送る場合はファイル名が消えるから記述している
        const encodedOriginalFileName = req.header("X-Original-File-Name");
        const originalFileName = encodedOriginalFileName
            ? decodeURIComponent(encodedOriginalFileName)
            : undefined;

        const result = await fileService.upload(req.file, originalFileName);

        res.status(201).json(result);
    } catch (e) {
        console.error("uploadエラー", e);
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