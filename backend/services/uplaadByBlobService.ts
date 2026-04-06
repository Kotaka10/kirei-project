export const uploadByBlob = async (file: Express.Multer.File, note: string) => {
    return {
        message: "アップロード成功",
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        note,
        contentPreview: file.buffer.toString("utf-8"),
    };
};