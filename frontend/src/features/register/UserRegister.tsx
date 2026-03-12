import { Link } from "react-router-dom";
import type { userInfoTypes } from "./types/userInfoTypes";
import { useState } from "react";

export default function UserRegister() {
    const [form, setForm] = useState<userInfoTypes>({
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

    return (
        <>
            <form className="bg-slate-100 p-8 m-auto rounded-xl">
            <h1 className="text-3xl text-center pb-6">ユーザー登録</h1>
                <div className="bg-white p-4 rounded-xl max-w-md mx-auto flex flex-col items-center justify-center gap-8">
                    <div className="flex flex-col w-64 sm:w-72 md:w-96">
                        <label htmlFor="companyName" className="mb-2 text-sm font-medium text-gray-700">名前</label>
                        <input
                            type="text"
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            placeholder="お客様名"
                            className="w-full rounded-md ring-1 ring-gray-300 px-3 py-2"
                        />
                    </div>
                    <div className="flex flex-col w-64 sm:w-72 md:w-96">
                        <label htmlFor="companyName" className="mb-2 text-sm font-medium text-gray-700">電話番号</label>
                        <input
                            type="text"
                            name="phoneNumber"
                            value={form.phoneNumber}
                            onChange={handleChange}
                            placeholder="電話番号（例：0123456789)"
                            className="w-full rounded-md ring-1 ring-gray-300 px-3 py-2"
                        />
                    </div>
                    <div className="flex flex-col w-64 sm:w-72 md:w-96">
                        <label htmlFor="companyName" className="mb-2 text-sm font-medium text-gray-700">郵便番号</label>
                        <input
                            type="text"
                            name="zipcode"
                            value={form.zipcode}
                            onChange={handleChange}
                            placeholder="0123456"
                            className="w-full rounded-md ring-1 ring-gray-300 px-3 py-2"
                        />
                    </div>
                    <button
                        type="button"
                        onClick={handleFetchAddress}
                        className="bg-gray-50 p-1 ring-1 ring-gray-300"
                    >
                        住所自動入力
                    </button>
                    <div className="flex flex-col w-64 sm:w-72 md:w-96">
                        <label htmlFor="companyName" className="mb-2 text-sm font-medium text-gray-700">都道府県</label>
                        <input
                            type="text"
                            name="prefecture"
                            value={form.prefecture}
                            onChange={handleChange}
                            className="w-full rounded-md ring-1 ring-gray-300 px-3 py-2"
                        />
                    </div>
                    <div className="flex flex-col w-64 sm:w-72 md:w-96">
                        <label htmlFor="companyName" className="mb-2 text-sm font-medium text-gray-700">市区町村</label>
                        <input
                            type="text"
                            name="city"
                            value={form.city}
                            onChange={handleChange}
                            className="w-full rounded-md ring-1 ring-gray-300 px-3 py-2"
                        />
                    </div>
                    <div className="flex flex-col w-64 sm:w-72 md:w-96">
                        <label htmlFor="companyName" className="mb-2 text-sm font-medium text-gray-700"></label>
                        <input
                            type="text"
                            name="otherAddress"
                            value={form.otherAddress}
                            onChange={handleChange}
                            className="w-full rounded-md ring-1 ring-gray-300 px-3 py-2"
                        />
                    </div>
                    <div className="flex flex-col w-64 sm:w-72 md:w-96">
                        <label htmlFor="companyName" className="mb-2 text-sm font-medium text-gray-700">アパートマンション名</label>
                        <input
                            type="text"
                            name="buildingName"
                            value={form.buildingName}
                            onChange={handleChange}
                            className="w-full rounded-md ring-1 ring-gray-300 px-3 py-2"
                        />
                    </div>
                    <div className="flex flex-col w-64 sm:w-72 md:w-96">
                        <label htmlFor="companyName" className="mb-2 text-sm font-medium text-gray-700">発行日</label>
                        <input
                            type="text"
                            name="publicationDate"
                            value={form.publicationDate}
                            onChange={handleChange}
                            className="w-full rounded-md ring-1 ring-gray-300 px-3 py-2"
                        />
                    </div>
                    <div className="flex flex-col w-64 sm:w-72 md:w-96">
                        <label htmlFor="companyName" className="mb-2 text-sm font-medium text-gray-700">有効期限</label>
                        <input
                            type="text"
                            name="expirationDate"
                            value={form.expirationDate}
                            onChange={handleChange}
                            className="w-full rounded-md ring-1 ring-gray-300 px-3 py-2"
                        />
                    </div>
                    <div className="flex flex-col w-64 sm:w-72 md:w-96">
                        <label htmlFor="companyName" className="mb-2 text-sm font-medium text-gray-700">備考欄</label>
                        <input
                            type="text"
                            name="notes"
                            value={form.notes}
                            onChange={handleChange}
                            className="w-full rounded-md ring-1 ring-gray-300 px-3 py-2"
                        />
                    </div>
                    <div className="flex flex-col w-64 sm:w-72 md:w-96">
                        <label htmlFor="companyName" className="mb-2 text-sm font-medium text-gray-700">メモ</label>
                        <input
                            type="text"
                            name="memo"
                            value={form.memo}
                            onChange={handleChange}
                            className="w-full rounded-md ring-1 ring-gray-300 px-3 py-2"
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full rounded-lg bg-slate-900 px-4 py-3 text-white hover:bg-slate-800"
                    >
                        ユーザー登録をする
                    </button>
                    <Link
                        to="/item-register"
                        className="text-blue-500 underline hover:text-blue-700"
                    >
                        商品登録が済んでない方はこちら
                    </Link>
                </div>
            </form>    
        </>
    )
}