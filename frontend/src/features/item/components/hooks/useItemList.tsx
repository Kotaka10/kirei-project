import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

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

    const [items, setItems] = useState(initialItems);
    const [keyword, setKeyword] = useState("");
    const navigate = useNavigate();

    const handleFindItem = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!keyword.trim()) {
            return;
        }

        const res = await fetch(`http://localhost:3000/api/items/search?name=${encodeURIComponent(keyword)}`);
        const data = await res.json();

        setItems(data);
    };

    useEffect(() => {
        const handelFetchItems = async () => {
            try {
                const res = await fetch('http://localhost:3000/api/items');

                if (!res.ok) {
                    console.error("商品情報の読み込みに失敗しました。")
                }

                const data = await res.json();
                setItems(data);
            } catch (error) {
                if (error instanceof Error) {
                    console.error("商品情報の取得に失敗しました。");
                }
            }
        }

        handelFetchItems();
    }, []);

    const handleEdit = async (id: number) => {
        navigate(`/item-edit/${id}`);
    }

    return {
        items,
        keyword,
        setKeyword,
        handleFindItem,
        handleEdit
    }
}