import useItemList from "./hooks/useItemList";
import { useParams } from "react-router-dom";

export default function ItemEdit() {
    const { items, handleChange, handleUpdate } = useItemList();
    const { id } = useParams();

    const item = items.find(i => i.id === Number(id));

    if (!item) {
        return <p>商品が見つかりません</p>;
    }
    
    return (
        <div className="">
            <div className="flex flex-col items-center justify-center gap-8 my-8 py-8 bg-sky-100 max-w-md mx-auto rounded-xl">
                <h1 className="text-3xl text-center my-4">商品情報の編集</h1>
                <form
                    key={item.id}
                    onSubmit={handleUpdate}
                    className="max-w-96"    
                >
                    <div className="flex flex-col w-64 sm:w-72 md:w-96">
                        <label className="">商品情報</label>
                        <input
                            name="itemName"
                            type="text"
                            value={item.itemName}
                            onChange={(e) => handleChange(e, item.id)}
                            className="w-full rounded-md ring-1 ring-gray-300 px-3 py-2"
                        />
                    </div>
                    <div className="flex flex-col w-64 sm:w-72 md:w-96">
                        <label className="">数量</label>
                        <input
                            name="quantity"
                            type="text"
                            value={item.quantity}
                            onChange={(e) => handleChange(e, item.id)}
                            className="w-full rounded-md ring-1 ring-gray-300 px-3 py-2"
                        />
                    </div>
                    <div className="flex flex-col w-64 sm:w-72 md:w-96">
                        <label className="">単位</label>
                        <input
                            name="unit"
                            type="text"
                            value={item.unit}
                            onChange={(e) => handleChange(e, item.id)}
                            className="w-full rounded-md ring-1 ring-gray-300 px-3 py-2"
                        />
                    </div>
                    <div className="flex flex-col w-64 sm:w-72 md:w-96">
                        <label className="">単価</label>
                        <input
                            name="unitPrice"
                            type="text"
                            value={item.unitPrice}
                            onChange={(e) => handleChange(e, item.id)}
                            className="w-full rounded-md ring-1 ring-gray-300 px-3 py-2"
                        />
                    </div>
                    <div className="flex flex-col w-64 sm:w-72 md:w-96">
                        <label className="">金額</label>
                        <input
                            name="price"
                            type="text"
                            value={item.price}
                            onChange={(e) => handleChange(e, item.id)}
                            className="w-full rounded-md ring-1 ring-gray-300 px-3 py-2"
                        />
                    </div>
                    <div className="flex flex-col w-64 sm:w-72 md:w-96">
                        <label className="">説明</label>
                        <textarea
                            name="description"
                            value={item.description}
                            onChange={(e) => handleChange(e, item.id)}
                            className="h-32 w-full rounded-md ring-1 ring-gray-300 px-3 py-2"
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full rounded-lg x-4 py-3 mt-4 bg-sky-500 text-white"
                    >
                        更新する
                    </button>
                </form>
            </div>
        </div>
    )
}