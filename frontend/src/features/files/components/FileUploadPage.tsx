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
        <>
            <h1 className="text-3xl text-center">ファイルアップロード</h1>
            <div className="mb-4">
                <input type="file" onChange={handleFileChange} />
                <button onClick={handleUpload} disabled={isLoading}>
                    {isLoading ? "アップロード中" : "アップロード"}
                </button>
            </div>

            {selectedFile && (
                <p>選択中： {selectedFile.name}</p>
            )}
            {message && (
                <p>{message}</p>
            )}
            
            <h2>保存済みファイル一覧</h2>
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
        </>
    )
}