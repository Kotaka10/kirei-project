export function CaseGeneratingState() {
    return (
        <div className="p-6 max-w-2xl mx-auto">
            <div className="flex flex-col items-center justify-center py-24 gap-6">
                <div className="w-14 h-14 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <div className="text-center">
                    <p className="text-lg font-semibold text-gray-700">AIが案件書類を作成中...</p>
                    <p className="text-sm text-gray-400 mt-1">適切なスタッフへOneSignal通知も自動で送信します</p>
                </div>
            </div>
        </div>
    );
}
