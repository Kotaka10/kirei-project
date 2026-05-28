import useFileUploadByBlob from "./hooks/useFileUploadByBlob";

export default function FileUploadByBlob() {
    const {
        jsonText,
        setJsonText,
        result,
        error,
        isValidJson,
        jsonError,
        handleUpload,
        handleFormat,
    } = useFileUploadByBlob();

    return (
        <div className="bg-gray-50 min-h-screen p-6">
            <div className="max-w-3xl mx-auto">
                <h1 className="text-xl font-bold text-gray-800 pl-3 border-l-4 border-purple-400 mb-5">
                    テキストBlobアップロード
                </h1>

                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                    {/* ラベル + JSON状態バッジ */}
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            JSONを入力
                        </p>
                        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                            isValidJson
                                ? "bg-green-100 text-green-700"
                                : "bg-red-50 text-red-600"
                        }`}>
                            {isValidJson ? "有効なJSON" : "不正なJSON"}
                        </span>
                    </div>

                    <textarea
                        value={jsonText}
                        onChange={(e) => setJsonText(e.target.value)}
                        className="h-72 w-full rounded-xl border border-gray-200 p-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-400 transition-colors resize-none"
                        placeholder='{"key": "value"}'
                    />

                    {!isValidJson && jsonError && (
                        <p className="mt-1.5 text-xs text-red-500 font-mono">{jsonError}</p>
                    )}

                    <div className="mt-3 flex gap-2">
                        <button
                            onClick={handleFormat}
                            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                            整形
                        </button>
                        <button
                            onClick={handleUpload}
                            disabled={!isValidJson}
                            className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700 transition-colors disabled:opacity-50"
                        >
                            Blob として送信
                        </button>
                    </div>

                    {error && (
                        <div className="mt-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                            {error}
                        </div>
                    )}

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
                </div>
            </div>
        </div>
    );
}
