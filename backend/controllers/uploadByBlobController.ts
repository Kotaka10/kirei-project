import type { Request, Response } from "express";
import { uploadByBlob } from "../services/uplaadByBlobService.js";

export const uploadFile = async (req: Request, res: Response) => {
    try {
        const file = req.file;
        const note = req.body.note;

        if (!file) {
            return res.status(400).json({ message: "fileがありません"});
        }

        const result = await uploadByBlob(file, note);

        return res.status(200).json(result);
    } catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({ message: "アップロードに失敗しました"});
    }
}