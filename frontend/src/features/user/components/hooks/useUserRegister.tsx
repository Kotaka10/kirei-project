import type { UserInfoTypes } from "../../../../../../shared/types/UserInfoTypes";
import { useState } from "react";

export default function useUserRegister() {
    const initialForm = {
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
    }

    const [form, setForm] = useState<UserInfoTypes>(initialForm);
    const [msg, setMsg] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const name = e.target.name as keyof UserInfoTypes;

        setForm((prev: UserInfoTypes) => ({
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

            if (!res.ok) {
                throw new Error("住所取得に失敗しました。");
            }

            const data = await res.json();
            if (data.results) {
                setForm((prev) => ({
                    ...prev,
                    prefecture: data.results[0].address1,
                    city: data.results[0].address2 + data.results[0].address3,
                }))
            }
        } catch (error) {
            console.error("error", error);
            alert("住所取得に失敗しました。");
        }
    }

    const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setMsg("");
        setIsLoading(true);

        try {
            const res = await fetch("http://localhost:3000/api/users", {
                method : "POST",
                headers : { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });

            if (!res.ok) {
                setMsg("商品の登録に失敗しました。");
            }

            const data = await res.json();

            console.log("data", data);

            alert(`${form.name}さんを登録しました`);
        } catch (error) {
            if (error instanceof Error) {
                setMsg(error.message);
            } else {
                setMsg("予期しないエラーが発生しました。");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return {
        form,
        msg,
        isLoading,
        handleChange,
        handleFetchAddress,
        handleRegister
    };
}