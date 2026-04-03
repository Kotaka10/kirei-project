import useFileUploadPage from "./hooks/useFileUploadPage";

export default function FileUploadPage() {
    const {
        selectedFile,
        files,
        message,
        isLoading,
        handleFileChange,
        handleUpload
    } = useFileUploadPage();

    return (
        <div className="flex flex-col items-center justify-center">
            <h1 className="text-3xl text-center py-4">ファイルアップロード</h1>
            <div className="mb-4">
                <input type="file" onChange={handleFileChange} />
                <button
                    onClick={handleUpload}
                    disabled={isLoading}
                    className="ring-2 ring-blue-500 rounded ml-4"
                >
                    {isLoading ? "アップロード中" : "アップロードする"}
                </button>
            </div>

            {selectedFile && (
                <p>選択中： {selectedFile.name}</p>
            )}
            {message && (
                <p>{message}</p>
            )}
            
            <h2 className="text-2xl py-4">保存済みファイル一覧</h2>
            {files.length === 0 ? (
                <p>ファイルはまだありません</p>
            ) : (
                <ul>
                    {files.map((file) => (
                        <li key={file.id}>
                            <a
                                href={file.url}
                                target="_blank"
                                rel="noreferrer"
                            >
                                {file.fileName}    
                            </a>                                
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}