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

        await fileRepository.insert(fileInfo)

        return {
            ...fileInfo,
            url: `http://localhost:8080/${fileInfo.storedPath}`
        };
    }
};