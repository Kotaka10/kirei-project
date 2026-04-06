import { useMemo, useState } from "react";
import type { UploadResponse } from "../../../types/UploadResponse";

export default function useFileUploadByBlob() {
    const [jsonText, setJsonText] = useState(`{
        "userId": 123,
        "name": "Takahiro",
        "tags": ["react", "typescript", "blob"],
        "settings": {
            "darkMode": true,
            "notifications": false
        }
    }`);

    const [result, setResult] = useState("");
    const [error, setError] = useState("");

    const isValidJson = useMemo(() => {
        try {
            JSON.parse(jsonText);
            return true;
        } catch {
            return false;
        }
    }, [jsonText]);

    const handleUpload = async () => {
        setError("");
        setResult("");

        try {
            const parsed = JSON.parse(jsonText);

            const formattedJson = JSON.stringify(parsed, null, 2);
            const jsonBlob = new Blob([formattedJson], {
                type: "application/json",
            });

            const formData = new FormData();
            formData.append("file", jsonBlob, "payload.json");
            formData.append("note", "textarea json upload practice");

            const res = await fetch("http://localhost:3000/upload-blob", {
                method: "POST",
                body: formData,
            });

            const data: UploadResponse = await res.json();

            if (!res.ok) {
                setError(data.message || "アップロードに失敗しました");
                return;
            }

            setResult(JSON.stringify(data, null, 2));
        } catch {
            setError("JSONの形式が正しくありません");
        }
    }

    const handleFormat = () => {
        try {
            const parsed = JSON.parse(jsonText);
            setJsonText(JSON.stringify(parsed, null, 2));
            setError("");
        } catch {
            setError("整形できません。JSONの形式を確認してください")
        }
    }

    return {
        jsonText,
        setJsonText,
        result,
        error,
        isValidJson,
        handleUpload,
        handleFormat,
    }

    /*
    const payload = { // 実データ　payload = 積み荷
        userId: 123,
        name: "Takahhiro",
        tags: ["react", "typescript", "blob"],
        settings: {
            darkMode: true,
            notifications: false,
        },
        createdAt: new Date().toISOString(),
    };

    const jsonString = JSON.stringify(payload, null, 2);
    // Blobの生成
    const jsonBlob = new Blob([jsonString], {
        type: "application/json",
    })

    // multipart/form-dataを作る
    const formData = new FormData();

    formData.append("file", jsonBlob, "data.json");
    formData.append("note", "json blob practice");

    try {
        const res = await fetch("http://localhost:3000/upload-blob", {
            method: "POST",
            body: formData,
            // Content-Typeをを固定すると壊れやすいから記述しない
        });

        const data: UploadResponse = await res.json();
        setResult(JSON.stringify(data, null, 2));
    } catch (error) {
        console.error(error);
        setResult("アップロードに失敗しました");
    }
    */
}