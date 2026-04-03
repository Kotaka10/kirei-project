import type { FileInfoTypes } from "../../shared/types/FileInfoTypes.js";
import { fileRepository } from "../repositories/fileRepository.js";

export const fileService = { // ←関数をプロパティとして持つオブジェクト fileService.uploadの形で他のファイルでimportすれば使える
    async upload(file?: Express.Multer.File, originalFileName?: string) {
        if (!file) throw new Error('ファイルなし');
        
        const safeOriginalName =
            typeof originalFileName === "string" && originalFileName.trim() !== ""
                ? originalFileName.trim()
                : file.originalname;

        const fileInfo = {
            fileName: safeOriginalName,
            storedFileName: file.filename,
            storedPath: `uploads/${file.filename}`,
            mimeType: file.mimetype,
            size: file.size
        };

        const insertId = await fileRepository.insert(fileInfo)

        return {
            id: insertId,
            ...fileInfo,
            url: `http://localhost:3000/uploads/${encodeURIComponent(file.filename)}`
        };
    },

    async getAllFiles() {
        const files = await fileRepository.findAllFiles();

        return (files as FileInfoTypes[]).map((file) => ({
            ...file,
            fileName: file.fileName?.trim(),
            storedFileName: file.storedFileName?.trim(),
            storedPath: file.storedPath?.trim(),
            mimeType: file.mimeType?.trim(),
            url: `http://localhost:3000/uploads/${encodeURIComponent(file.storedFileName.trim())}`
        }));
    }
};