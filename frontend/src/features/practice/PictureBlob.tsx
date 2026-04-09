import usePictureBlob from "./hooks/usePictureBlob";

export default function PictureBlob() {
    const {
        originalUrl,
        processedUrl,
        handleChange,
        handleUpload,
        result,
        setSelectedFile
    } = usePictureBlob();

    return (
        <div className="min-h-screen bg-slate-50 p-8">
            <div className="mx-auto max-w-4xl rounded-2xl bg-white p-6 shadow">
                <h1 className="mb-4 text-2xl font-bold">ファイル Blob</h1>

                <input type="file" accept="image/*" onChange={handleChange} />

                <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                        <h2 className="mb-2 text-xl font-semibold text-black">元画像</h2>
                        {originalUrl ? (
                            <img src={originalUrl} alt="original" className="rounded-xl border" />
                        ) : (
                            <p>画像が未選択です</p>
                        )}
                    </div>

                    <div>
                        <h2 className="mb-2 text-xl font-semibold text-black">加工後画像</h2>
                        {processedUrl ? (
                            <img src={processedUrl} alt="processed" className="rounded-xl border" />
                        ) : (
                            <p>まだ加工画像はありません</p>
                        )}
                    </div>
                </div>

                <input
                    type="file"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
                    className="my-8 block"
                />
                <button
                    onClick={handleUpload}
                    className="rounded-xl bg-black px-4 py-2 text-white"
                >
                    保存
                </button>
                <pre className="mt-6 overflow-auto rounded-xl bg-slate-100 p-4 text-sm">
                    {result}
                </pre>
                <img
                    src="http://localhost:3000/upload-blob/2"
                    alt="uploaded"
                    className="rounded-xl border mt-4 w-full h-full"
                />
            </div>
        </div>
    )
}