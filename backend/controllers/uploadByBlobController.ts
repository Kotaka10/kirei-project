import type { Request, Response } from "express";
// import { uploadByBlob } from "../services/uploadByBlobService.js";
import * as uploadByBlobService from "../services/uploadByBlobService.js";

/* export const uploadFile = async (req: Request, res: Response) => {
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
} */

export const upload = async (req: Request, res: Response) => {
    try {
        const file = req.file;

        if (!file) {
            return res.status(400).json({ message: "fileがありません" });
        }

        const result = await uploadByBlobService.uploadFileByBlob(file);

        return res.json({
            message: "保存成功",
            file: result.rows[0],
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "保存に失敗しました" });
    }
};

export const display = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        const file = await uploadByBlobService.getFile(id);

        res.setHeader("Contet-Type", file.mimetype);
        res.setHeader("Content-Disposition", `inline; filename="${file.filename}"`);

        return res.send(file.data);
    } catch (err) {
        console.error(err);
        return res.status(500).send("取得に失敗しました");
    }
}