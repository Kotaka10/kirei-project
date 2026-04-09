import * as uploadByBlobRepository from "../repositories/uploadByBlobRepository.js";

/* export const uploadByBlob = async (file: Express.Multer.File, note: string) => {
    return {
        message: "アップロード成功",
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        note,
        contentPreview: file.buffer.toString("utf-8"),
    };
}; */

export const uploadFileByBlob = async (file: Express.Multer.File) => {
    return await uploadByBlobRepository.registerFileByBlob(file);
};

export const getFile = async (id: number) => {
    const file = await uploadByBlobRepository.findFileById(id);

    if (!file) {
        throw new Error("ファイルが見つかりません");
    }

    return file;
}