import useItemList from "./hooks/useItemList";

export default function ItemEdit() {
    const {
        items
    } = useItemList();
    
    return (
        <>
            <h1 className="text-3xl text-center">商品情報の編集</h1>
            {items.map(i => (
                <div key={i.id}>
                    <div className="flex flex-col">
                        <label className="">商品情報</label>
                        <input
                            name="itemName"
                            type="text"
                            value={i.itemName}
                            className=""
                        />
                    </div>
                    <div className="">
                        <label className="">数量</label>
                        <input
                            name="quantity"
                            type="text"
                            value={i.quantity}
                            className=""
                        />
                    </div>
                    <div className="">
                        <label className="">単位</label>
                        <input
                            name="unit"
                            type="text"
                            value={i.unit}
                            className=""
                        />
                    </div>
                    <div className="">
                        <label className="">単価</label>
                        <input
                            name="unitPrice"
                            type="text"
                            value={i.unitPrice}
                            className=""
                        />
                    </div>
                    <div className="">
                        <label className="">金額</label>
                        <input
                            name="price"
                            type="text"
                            value={i.price}
                            className=""
                        />
                    </div>
                    <div className="">
                        <label className="">説明</label>
                        <textarea
                            name="description"
                            value={i.description}
                            className=""
                        />
                    </div>
                </div>
            ))}
            
        </>
    )
}