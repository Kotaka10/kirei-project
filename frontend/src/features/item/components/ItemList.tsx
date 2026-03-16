import userItemList from "./hooks/useItemList";
import type { itemInfoTypes } from "../../../../../shared/types/itemInfoTypes";

export default function ItemList() {
    const {
        items,
        keyword,
        setKeyword,
        msg,
        handleFindItem
    } = userItemList();

    return (
        <>
            <div className="p-8">
                <h1 className="text-3xl font-semibold mb-6">商品一覧</h1>
                <div className="flex gap-3 mb-6">
                    <form onSubmit={handleFindItem}>
                        <input
                            type="text"
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            placeholder="商品名で検索"
                            className="flex-1 rounded-md ring-1 ring-gray-300 px-3 py-2"
                        />
                        <button
                            type="submit"
                            className="px-4 py-2 rounded-md bg-slate-900 text-white"
                        >
                            検索
                        </button>
                    </form>
                </div>
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="border-b bg-gray-50">
                            <th className="p-3 text-left">商品名</th>
                            <th className="p-3 text-left">数量</th>
                            <th className="p-3 text-left">単価</th>
                            <th className="p-3 text-left">金額</th>
                            <th className="p-3 text-left">操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((i: itemInfoTypes) => (
                            <tr key={i.id} className="border-b">
                                <td className="p-3">{i.itemName}</td>
                                <td className="p-3">{i.quantity}</td>
                                <td className="p-3">{i.unitPrice}</td>
                                <td className="p-3">{i.price}</td>
                                <td className="p-3 flex gap-3">
                                    <button className="text-blue-600">編集</button>
                                    <button className="text-red-600">削除</button>
                                </td>
                            </tr>
                        ))}    
                    </tbody>
                </table>
            </div>
        </>
    )
}