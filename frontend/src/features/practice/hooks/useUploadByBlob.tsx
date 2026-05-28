import { useState } from "react";
import type { UploadByBlobResponse } from "../../types/UploadResponse";

export default function usePictureBlob() {
    const [originalUrl, setOriginalUrl] = useState("");
    const [processedUrl, setProcessedUrl] = useState("");
    const [processedBlob, setProcessedBlob] = useState<Blob | null>(null);
    const [result, setResult] = useState("");
    const [uploadedId, setUploadedId] = useState(0);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]; // input[type="file"]からファイルを一つ取得
        if (!file) return;

        const originalObjectUrl = URL.createObjectURL(file); // ファイルをブラウザで表示できるURLに変換
        setOriginalUrl(originalObjectUrl);
        setProcessedBlob(null);
        setProcessedUrl("");

        const img = new Image();
        img.src = originalObjectUrl; // JSで画像を扱うためにImageに読み込み

        img.onload = async () => {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            if (!ctx) return;

            // 元画像が300px未満の場合は拡大しない
            const width = Math.min(300, img.width);
            const scale = width / img.width;
            const height = img.height * scale;

            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height); // 元画像 → リサイズしてcanvasに描く

            const blob = await new Promise<Blob | null>((resolve) => {
                canvas.toBlob(resolve, "image/jpeg", 0.9); // JPEG形式　品質90％
            });

            if (!blob) return;

            setProcessedBlob(blob);
            setProcessedUrl(URL.createObjectURL(blob));
        };
    };

    const handleUpload = async () => {
        if (!processedBlob) {
            setResult("先に画像を選択してください");
            return;
        }

        const formData = new FormData();
        formData.append("file", processedBlob, "processed.jpg");

        try {
            const res = await fetch("http://localhost:3000/upload-blob", {
                method: "POST",
                body: formData,
            });

            const data: UploadByBlobResponse = await res.json();
            setUploadedId(Number(data.file?.id));
            setResult(JSON.stringify(data, null, 2));
        } catch (err) {
            console.error(err);
            setResult("アップロードに失敗しました");
        }
    };

    return {
        originalUrl,
        processedUrl,
        processedBlob,
        handleChange,
        handleUpload,
        result,
        uploadedId,
    };
}