import useItemList from "./hooks/useItemList";
import type { ItemInfoTypes } from "../../../../../shared/types/ItemInfoTypes";

const inputCls = "rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-400 transition-colors";

export default function ItemList() {
    const {
        items,
        keyword,
        setKeyword,
        handleFindItem,
        handleEdit,
        handleDelete
    } = useItemList();

    return (
        <div className="bg-gray-50 min-h-screen p-6">
            <div className="max-w-5xl mx-auto">
                <h1 className="text-xl font-bold text-gray-800 pl-3 border-l-4 border-teal-400 mb-5">
                    商品一覧
                </h1>

                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-gray-100">
                        <form onSubmit={handleFindItem} className="flex gap-2">
                            <input
                                type="text"
                                value={keyword}
                                onChange={(e) => setKeyword(e.target.value)}
                                placeholder="商品名で検索"
                                className={inputCls + " flex-1"}
                            />
                            <button
                                type="submit"
                                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                            >
                                検索
                            </button>
                        </form>
                    </div>

                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">商品名</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">数量</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">単位</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">単価</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">金額</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">内容</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {items.map((i: ItemInfoTypes) => (
                                <tr key={i.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3 text-sm text-gray-800">{i.itemName}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{i.quantity}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{i.unit}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{i.unitPrice}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">
                                        {((Number(i.quantity) || 0) * (Number(i.unitPrice) || 0)).toLocaleString()}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">{i.description}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleEdit(i.id)}
                                                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                                            >
                                                編集
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDelete(i.id)}
                                                className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                                            >
                                                削除
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {items.length === 0 && (
                        <div className="p-8 text-center text-sm text-gray-400">
                            該当する商品が見つかりません
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
