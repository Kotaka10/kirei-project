import { useState } from "react";
import useFileUploadPage from "./hooks/useFileUploadPage";

export default function FileUploadPage() {
    const {
        selectedFile,
        files,
        message,
        fetchError,
        isLoading,
        handleFileChange,
        handleDrop,
        handleUpload
    } = useFileUploadPage();

    const [isDragging, setIsDragging] = useState(false);

    return (
        <div className="bg-gray-50 min-h-screen p-6">
            <div className="max-w-2xl mx-auto">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3 mb-6">
                    <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-100 text-xl shrink-0">📁</span>
                    ファイルアップロード
                </h1>

                {/* アップロードカード */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-5">
                    <p className="text-sm font-medium text-gray-600 mb-3">
                        ファイルを選択してアップロード
                    </p>

                    <label
                        className={`flex flex-col items-center justify-center gap-2 w-full rounded-xl border-2 border-dashed py-10 cursor-pointer transition-colors ${
                            isDragging
                                ? "border-blue-400 bg-blue-50/40"
                                : "border-gray-200 hover:border-blue-300 hover:bg-blue-50/20"
                        }`}
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragEnter={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={(e) => { handleDrop(e); setIsDragging(false); }}
                    >
                        {isDragging ? (
                            <>
                                <span className="text-3xl">📂</span>
                                <span className="text-base font-semibold text-blue-500">ここにドロップ</span>
                            </>
                        ) : selectedFile ? (
                            <>
                                <span className="text-3xl">📄</span>
                                <span className="text-base font-semibold text-blue-600">{selectedFile.name}</span>
                                <span className="text-sm text-gray-400">クリックして変更 またはドラッグ&ドロップ</span>
                            </>
                        ) : (
                            <>
                                <span className="text-3xl">📁</span>
                                <span className="text-base font-semibold text-gray-600">クリックしてファイルを選択</span>
                                <span className="text-sm text-gray-400">またはここにドラッグ&ドロップ</span>
                                <span className="text-sm text-gray-400">画像（jpg・png）・PDF・Excel など</span>
                            </>
                        )}
                        <input type="file" onChange={handleFileChange} className="sr-only" />
                    </label>

                    <button
                        onClick={handleUpload}
                        disabled={isLoading || !selectedFile}
                        className="mt-4 w-full rounded-xl bg-blue-600 px-4 py-3 text-base font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                        {isLoading ? "アップロード中..." : "アップロードする →"}
                    </button>

                    {message && (
                        <div className="mt-3 rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-700">
                            {message}
                        </div>
                    )}
                </div>

                {/* 保存済みファイル一覧 */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                    <p className="text-sm font-medium text-gray-600 mb-4">
                        保存済みファイル一覧
                    </p>

                    {fetchError ? (
                        <p className="text-center py-8 text-sm text-gray-400">
                            ファイル一覧を取得できませんでした
                        </p>
                    ) : files.length === 0 ? (
                        <p className="text-center py-8 text-sm text-gray-400">
                            まだファイルがアップロードされていません
                        </p>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {files.map((file) => (
                                <a
                                    key={file.id}
                                    href={file.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="group rounded-xl border border-gray-200 overflow-hidden hover:border-blue-300 hover:shadow-sm transition-all"
                                >
                                    <div className="aspect-square bg-gray-50 overflow-hidden">
                                        <img
                                            src={file.url}
                                            alt={file.fileName}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                        />
                                    </div>
                                    <div className="px-2 py-1.5 border-t border-gray-100">
                                        <p className="text-xs text-gray-600 truncate">{file.fileName}</p>
                                    </div>
                                </a>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
