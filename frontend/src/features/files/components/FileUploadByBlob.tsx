import useFileUploadByBlob from "./hooks/useFileUploadByBlob";

export default function FileUploadByBlob() {
    const {
        text,
        setText,
        result,
        handleUpload
    } = useFileUploadByBlob();

    return (
        <div className="min-h-screen bg-slate-50 p-8">
            <div className="mx-auto max-w-xl rounded-2xl bg-white p-6 shadow">
                <h1 className="mb-4 text-2xl fond-bold">Blob</h1>

                <label className="mb-2 block text-sm font-medium">
                    テキストをBlobににして送信
                </label>

                <textarea
                    className="mb-4 h-40 w-full rounded-xl border p-3"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                />

                <button
                    onClick={handleUpload}
                    className="rounded-xl bg-black px-4 py-2 text-white"
                >
                    Upload
                </button>

                <pre className="mt-6 overflow-auto rounded-xl bg-slate-100 p-4 text-sm">
                    {result}
                </pre>
            </div>
        </div>
    )
}