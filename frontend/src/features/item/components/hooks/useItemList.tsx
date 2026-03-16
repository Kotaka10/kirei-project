import { useEffect, useState } from "react";

export default function userItemList() {
    const initialItems= [{
        id: 0,
        itemName: "",
        content: "",
        quantity: "",
        unit: "",
        unitPrice: "",
        price: "",
    }];

    const [msg, setMsg] = useState("");
    const [items, setItems] = useState(initialItems);

    const handleFindItem = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const input = e.target.value;

        if (!input) return [];

        const res = await fetch("http://localhost:3000/api/items");
        const data = await res.json();

        const results = data.filter((item: { itemName: string }) =>
            item.itemName.toLocaleLowerCase().includes(input.toLocaleLowerCase())
        );

        return results;
    }

    useEffect(() => {
        const handelFetchItems = async () => {
            try {
                const res = await fetch('http://localhost:3000/api/items');

                if (!res.ok) {
                    console.error("商品情報の読み込みに失敗しました。")
                }

                const data = await res.json();
                setItems(data);
                setMsg("商品情報の取得に成功しました。");
            } catch (error) {
                if (error instanceof Error) {
                    setMsg(error.message);
                } else {
                    setMsg("商品情報の取得に失敗しました。");
                }
            }
        }

        handelFetchItems();
    }, []);

    return {
        items,
        msg,
        handleFindItem
    }
}