import { useState } from "react";
import type { UploadByBlobResponse } from "../../types/UploadResponse";
import { useParams } from "react-router-dom";

export default function usePictureBlob() {
    const [originalUrl, setOriginalUrl] = useState("");
    const [processedUrl, setProcessedUrl] = useState("");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [result, setResult] = useState("");

    const { id } = useParams();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const originalObjectUrl = URL.createObjectURL(file);
        setOriginalUrl(originalObjectUrl);

        const img = new Image();
        img.src = originalObjectUrl;

        img.onload = async () => {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            if (!ctx) return;

            const width = 300;
            const scale = width / img.width;
            const height = img.height * scale;

            canvas.width = width;
            canvas.height = height;

            ctx.drawImage(img, 0, 0, width, height);

            const blob = await new Promise<Blob | null>((resolve) => {
                canvas.toBlob(resolve, "image/jpeg", 0.9);
            });

            if (!blob) return;

            const processedObjectUrl = URL.createObjectURL(blob);
            setProcessedUrl(processedObjectUrl);

            console.log("processed blob", blob);
            console.log("type", blob.type);
            console.log("size", blob.size);
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
            setResult(JSON.stringify(data, null, 2));
        } catch (err) {
            console.error(err);
            setResult("アップロードアップロードに失敗しました");
        }
    }

    const fetchFileById = async () => {
        try {
            const res = await fetch(`http://localhost:3000/upload-blob/${id}`);
            if (!res.ok) {
                throw new Error("ファイルが見つかりませんでした");
            }

            await res.json();
        } catch (err) {
            console.error(err);
            setResult("ファイルの取得に失敗しました");
        }
    }

    return {
        originalUrl,
        processedUrl,
        handleChange,
        handleUpload,
        result,
        setSelectedFile,
        id
    }
}