import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";
import type { itemInfoTypes } from "../../../../../../shared/types/itemInfoTypes";

export default function useItemList() {
    const [item, setItem] = useState<itemInfoTypes>({
        id: 0,
        itemName: "",
        description: "",
        quantity: "",
        unit: "",
        unitPrice: "",
        price: "",
    })
    const [items, setItems] = useState<itemInfoTypes[]>([]);
    const [keyword, setKeyword] = useState("");
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();

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
        if (!id) return;

        const found = items.find(i => i.id === Number(id));

        if (found) {
            setItem(found);
        }
    }, [id, items]);

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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, id: number) => {
        const { name, value } = e.target;

        setItems((prev) => 
            prev.map((item) =>
            item.id === id
                ? {...item, [name]: value}
                : item
            )
        )
    }

    const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        try {
            const res = await fetch(`http://localhost:3000/api/items/item-edit/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(item)
            })

            if (!res.ok) {
                throw new Error("商品情報の更新に失敗しました")
            }

            const data = await res.json();
            setItem(data);
            alert("更新しました")
            navigate("/item-list");
        } catch(error) {
            console.error("error", error);
            alert("通信の問題が発生しました")
        }
    }

    return {
        items,
        keyword,
        setKeyword,
        handleFindItem,
        handleEdit,
        handleChange,
        handleUpdate
    }
}