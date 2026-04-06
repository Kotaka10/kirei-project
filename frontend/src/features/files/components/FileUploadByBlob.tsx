import useFileUploadByBlob from "./hooks/useFileUploadByBlob";

export default function FileUploadByBlob() {
    const {
        jsonText,
        setJsonText,
        result,
        error,
        isValidJson,
        handleUpload,
        handleFormat,
    } = useFileUploadByBlob();

    return (
        <div className="min-h-screen bg-slate-50 p-8">
            <div className="mx-auto max-w-3xl rounded-2xl bg-white p-6 shadow">
                <h1 className="mb-4 text-2xl fond-bold">Json Blob</h1>

                <label className="mb-2 block text-sm font-medium">
                    JSONを入力
                </label>

                <textarea
                    value={jsonText}
                    onChange={(e) => setJsonText(e.target.value)}
                    className="h-80 w-full rounded-xl border p-3 font-mono text-sm"
                />

                <div className="mt-3 flex gap-3">
                    <button
                        onClick={handleFormat}
                        className="rounded-xl border px-4 py-2"
                    >
                        整形
                    </button>
                    <button
                        onClick={handleUpload}
                        className="rounded-xl bg-black px-4 py-2 text-white disabled: opacity-50"
                        disabled={!isValidJson}
                    >
                        Blobにして送信
                    </button>
                </div>

                <p className="mt-3 text-sm">
                    状態：{" "}
                    <span className={isValidJson ? "text-green-600" : "text-red-600"}>
                        {isValidJson ? "有効なJSON" : "不正なJSON"}
                    </span>
                </p>

                {error && (
                    <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
                        {error}
                    </div>
                )}

                {result && (
                    <pre className="mt-4 overflow-auto rounded-xl bg-slate-100 p-4 text-sm">
                        {result}
                    </pre>
                )}
            </div>
        </div>
    )
}