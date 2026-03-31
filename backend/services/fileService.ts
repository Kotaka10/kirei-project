import type { FileInfoTypes } from "../../shared/types/FileInfoTypes.js";
import { fileRepository } from "../repositories/fileRepository.js";

export const fileService = {
    async upload(file?: Express.Multer.File) {
        if (!file) throw new Error('ファイルなし');

        const fileInfo = {
            fileName: file.originalname,
            storedFileName: file.filename,
            storedPath: `uploads/${file.filename}`,
            mimeType: file.mimetype,
            size: file.size
        };

        const insertId = await fileRepository.insert(fileInfo)

        return {
            id: insertId,
            ...fileInfo,
            url: `http://localhost:3000/${fileInfo.storedPath}`
        };
    },

    async getAllFiles() {
        const files = await fileRepository.findAllFiles();

        return (files as FileInfoTypes[]).map((file) => ({
            ...file,
            url: `http://localhost:3000/${file.storedPath}`
        }));
    }
};