export type UploadResponse = {
    message: string;
    originalname?: string;
    mimetype?: string;
    size?: number;
    note?: string;
    parsedJson?: unknown;
}

export type UploadByBlobResponse = {
    message: string;
    file?: {
        id: number;
        filename: string;
        mimetype: string;
        size: number;
        created_at: string;
    };
};