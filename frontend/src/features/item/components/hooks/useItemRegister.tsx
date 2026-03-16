import { useState } from "react";
import type { itemInfoTypes } from "../../../../../../shared/types/itemInfoTypes";

export default function useItemRegister() {
    const [form, setForm] = useState<itemInfoTypes>({
        id: 0,
        itemName: "",
        content: "",
        quantity: "",
        unit: "",
        unitPrice: "",
        price: "",
    });

    const handleChange = async (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const name = e.target.name as keyof itemInfoTypes;
        
         setForm((prev) => ({
            ...prev,
            [name]: e.target.value
        }));
    };

    const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        const res = await fetch("http://localhost:3000/api/items", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form)
        });

        if (!res.ok) {
            throw new Error("商品の登録に失敗しました。")
        }
        
        await res.json();
    }

    return {
        form,
        handleChange,
        handleRegister
    }
}