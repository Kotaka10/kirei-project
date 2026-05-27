import usePictureBlob from "./hooks/useUploadByBlob";

function EmptyImageBox({ label }: { label: string }) {
    return (
        <div className="flex items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 aspect-video">
            <p className="text-sm text-gray-400">{label}</p>
        </div>
    );
}

export default function UploadByBlob() {
    const {
        originalUrl,
        processedUrl,
        handleChange,
        handleUpload,
        result,
        setSelectedFile,
        uploadedId
    } = usePictureBlob();

    return (
        <div className="bg-gray-50 min-h-screen p-6">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-xl font-bold text-gray-800 pl-3 border-l-4 border-amber-400 mb-5">
                    画像Blobアップロード
                </h1>

                {/* プレビューセクション */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-5">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                        プレビュー
                    </p>

                    <label className="flex flex-col items-center justify-center gap-1 w-full rounded-xl border-2 border-dashed border-gray-200 py-5 cursor-pointer hover:border-amber-300 hover:bg-amber-50/20 transition-colors mb-5">
                        {originalUrl ? (
                            <>
                                <span className="text-sm font-semibold text-amber-600">画像を選択中</span>
                                <span className="text-xs text-gray-400">クリックして変更</span>
                            </>
                        ) : (
                            <>
                                <span className="text-sm font-semibold text-gray-600">プレビュー用の画像を選択</span>
                                <span className="text-xs text-gray-400">jpg・png・gif など</span>
                            </>
                        )}
                        <input type="file" accept="image/*" onChange={handleChange} className="sr-only" />
                    </label>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">元画像</p>
                            {originalUrl ? (
                                <img src={originalUrl} alt="original" className="w-full rounded-xl border border-gray-200 object-contain" />
                            ) : (
                                <EmptyImageBox label="未選択" />
                            )}
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">加工後画像</p>
                            {processedUrl ? (
                                <img src={processedUrl} alt="processed" className="w-full rounded-xl border border-gray-200 object-contain" />
                            ) : (
                                <EmptyImageBox label="まだ加工画像はありません" />
                            )}
                        </div>
                    </div>
                </div>

                {/* Blob保存セクション */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                        Blob として保存
                    </p>

                    <label className="flex flex-col items-center justify-center gap-1 w-full rounded-xl border-2 border-dashed border-gray-200 py-5 cursor-pointer hover:border-amber-300 hover:bg-amber-50/20 transition-colors mb-4">
                        <span className="text-sm font-semibold text-gray-600">保存する画像を選択</span>
                        <span className="text-xs text-gray-400">選択後に「保存」ボタンを押してください</span>
                        <input
                            type="file"
                            onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
                            className="sr-only"
                        />
                    </label>

                    <button
                        onClick={handleUpload}
                        className="w-full rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-600 transition-colors"
                    >
                        保存する
                    </button>

                    {result && (
                        <>
                            <p className="mt-5 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                                レスポンス
                            </p>
                            <pre className="overflow-auto rounded-xl bg-gray-900 text-gray-100 p-4 text-xs font-mono leading-relaxed">
                                {result}
                            </pre>
                        </>
                    )}

                    {uploadedId !== 0 && (
                        <div className="mt-5">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                                保存済み画像
                            </p>
                            <img
                                src={`http://localhost:3000/upload-blob/${uploadedId}`}
                                alt="uploaded"
                                className="w-full rounded-xl border border-gray-200 object-contain"
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
