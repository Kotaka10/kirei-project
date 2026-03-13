import type { userInfoTypes } from "../../../../../../shared/types/userInfoTypes";
import { useState } from "react";

export default function useUserRegister() {
    const [form, setForm] = useState<userInfoTypes>({
        id: 0,
        name: "",
        phoneNumber: "",
        zipcode: "",
        prefecture: "",
        city: "",
        otherAddress: "",
        buildingName: "",
        publicationDate: "",
        expirationDate: "",
        notes: "",
        memo: "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const name = e.target.name as keyof userInfoTypes;

        setForm((prev: userInfoTypes) => ({
            ...prev,
            [name]: e.target.value,
        }))
    }
    
    const handleFetchAddress = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        fetchAddress(form.zipcode);
    }

    const fetchAddress = async (zipcode: string) => {
        if (!/^\d{7}$/.test(zipcode)) {
            alert("有効な7桁の数字を入力してください。")
            return;
        }

        try {
            const res = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${zipcode}`);
            const data = await res.json();
            if (data.results) {
                setForm((prev) => ({
                    ...prev,
                    prefecture: data.results[0].address1,
                    city: data.results[0].address2 + data.results[0].address3,
                }))
            }
        } catch (error) {
            alert("住所取得に失敗しました。")
        }
    }

    const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const res = await fetch("http://localhost:3000/api/users", {
            method : "POST",
            headers : { "Content-Type": "application/json" },
            body: JSON.stringify(form),
        });
        await res.json();
    };

    return {
        form,
        handleChange,
        handleFetchAddress,
        handleRegister
    };
}