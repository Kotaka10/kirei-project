import { useState } from "react";
import type { UploadByBlobResponse } from "../../types/UploadResponse";

export default function usePictureBlob() {
    const [originalUrl, setOriginalUrl] = useState("");
    const [processedUrl, setProcessedUrl] = useState("");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [result, setResult] = useState("");
    const [uploadedId, setUploadedId] = useState(0);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]; // input[type="file"]からファイルを一つ取得
        if (!file) return;

        const originalObjectUrl = URL.createObjectURL(file); // ファイルをブラウザで表示できるURLに変換
        setOriginalUrl(originalObjectUrl);

        const img = new Image();
        img.src = originalObjectUrl; // JSで画像を扱うためにImageに読み込み

        img.onload = async () => {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            if (!ctx) return;

            const width = 300;
            const scale = width / img.width;
            const height = img.height * scale; // 幅を300pxに固定して縦横比を維持

            canvas.width = width;
            canvas.height = height;

            ctx.drawImage(img, 0, 0, width, height); // 元画像 → リサイズしてcanvasに描く

            const blob = await new Promise<Blob | null>((resolve) => { // blobに変換
                canvas.toBlob(resolve, "image/jpeg", 0.9); // JPEG形式　品質90％
            });

            if (!blob) return;

            const processedObjectUrl = URL.createObjectURL(blob);
            setProcessedUrl(processedObjectUrl);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            setResult("ファイルを選択してください");
            return;
        }

        const formData = new FormData();
        formData.append("file", selectedFile);

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
            setResult("アップロードアップロードに失敗しました");
        }
    }

    return {
        originalUrl,
        processedUrl,
        handleChange,
        handleUpload,
        result,
        setSelectedFile,
        uploadedId
    }
}