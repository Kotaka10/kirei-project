import { useState } from "react";


export default function useFileUploadByBlob() {
    const [text, setText] = useState("Hello Blob Upload");
    const [result, setResult] = useState("");

    const handleUpload = async () => {
        try {
            // Blobの生成
            const blob = new Blob([text], { type: "text/plain" });

            // multipart/form-dataを作る
            const formData = new FormData();

            formData.append("file", blob, "sample.txt");
            formData.append("note", "blob practice");

            const res = await fetch("http://localhost:3000/upload", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();
            setResult(JSON.stringify(data, null, 2));
        } catch (error) {
            console.error(error);
            setResult("アップロードに失敗しました");
        }
    }

    return {
        text,
        setText,
        result,
        handleUpload,
    }
}