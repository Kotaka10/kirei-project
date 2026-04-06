export type UploadResponse = {
    message: string;
    originalname?: string;
    mimetype?: string;
    size?: number;
    note?: string;
    parsedJson?: unknown;
}