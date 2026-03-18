import { useState } from "react";
import type { itemInfoTypes } from "../../../../../../shared/types/itemInfoTypes";

export default function useItemRegister() {
    const initialForm: itemInfoTypes = {
        id: 0,
        itemName: "",
        description: "",
        quantity: 0,
        unit: "",
        unitPrice: 0,
    }

    const [form, setForm] = useState<itemInfoTypes>(initialForm);
    const [msg, setMsg] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = async (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const {name, value} = e.target;
        
         setForm((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setMsg("");
        setIsLoading(true);

        try {
                const res = await fetch("http://localhost:3000/api/items", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form)
            });

            if (!res.ok) {
                throw new Error("商品の登録に失敗しました。")
            }
            
            await res.json();
            setMsg(`${form.itemName}を登録しました`);
        } catch (error) {
            if (error instanceof Error) {
                setMsg(error.message);
            } else {
                setMsg("予期しないエラーが発生しました。");
            }
        } finally {
            setIsLoading(false);
        }
    }

    return {
        form,
        msg,
        isLoading,
        handleChange,
        handleRegister
    }
}