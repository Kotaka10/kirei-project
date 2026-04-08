import { useState } from "react";

export default function usePictureBlob() {
    const [originalUrl, setOriginalUrl] = useState("");
    const [processedUrl, setProcessedUrl] = useState("");

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

    return {
        originalUrl,
        processedUrl,
        handleChange
    }
}