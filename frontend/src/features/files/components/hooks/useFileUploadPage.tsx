import  { useEffect, useState } from "react";
import type { FileInfoTypes } from "../../../../../../shared/types/FileInfoTypes";

export default function useFileUploadPage() {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [files, setFiles] = useState<FileInfoTypes[]>([]);
    const [message, setMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) {
            setSelectedFile(null);
            return;
        }
        setSelectedFile(e.target.files[0]);
    }

    const fetchFiles = async () => {
        try {
            const res = await fetch("http://localhost:3000/api/uploads");
            if (!res.ok) {
                throw new Error("ファイルの取得に失敗しました");
            }
            const data = await res.json();
            setFiles(data.files);
        } catch (error) {
            if (error instanceof Error) {
                console.error(error);
                setMessage(error.message);
            } else {
                console.error("通信の問題が発生しました");
                setMessage("通信の問題が発生しました");
            }
        }
    }

    const handleUpload = async () => {
        if (!selectedFile) {
            setMessage("ファイルを選択して下さい");
            return;
        }

        const formData = new FormData();
        formData.append("file", selectedFile);

        try {
            setIsLoading(true);
            setMessage("");

            const res = await fetch("http://localhost:3000/api/uploads", {
                method: "POST", 
                body: formData,
                headers: {
                    "X-Original-File-Name": encodeURIComponent(selectedFile.name),
                }
            });

            if (!res.ok) {
                const errorText = await res.text();
                console.error("upload error response", errorText);
                throw new Error("アップロードに失敗しました");
            }

            const data = await res.json();
            setMessage(`アップロード成功： ${data.fileName}`);
            setSelectedFile(null);

            await fetchFiles();
        } catch (error) {
            if (error instanceof Error) {
                console.error(error);
                setMessage(error.message);
            } else {
                console.error("通信の問題が発生しました");
                setMessage("通信の問題が発生しました");
            }
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        fetchFiles();
    }, []);

    return {
        selectedFile,
        files,
        message,
        isLoading,
        handleFileChange,
        handleUpload
    }
}