import { useEffect, useState } from "react";
import type { CompanyInfoTypes } from "./types/companyInfoTypes";
import { PREFECTURES } from "./types/prefectures";
import { useAddress } from "./components/useAddress";

export default function RegisterForm() {
    const [form, setForm] = useState<CompanyInfoTypes>({
        id: 0,
        companyName: "",
        zipcode: "",
        prefecture: "",
        city: "",
        otherAddress: "",
        buildingName: "",
        phoneNumber: "",
        email: [""],
        contractDate: "",
        status: null,
        cancellationDate: "",
    });

    const [msg, setMsg] = useState("");

    const { fetchAddress } = useAddress();

    const contractStatusOptions = [
        { value: "active", label: "契約中" },
        { value: "negotiating", label: "商談中" },
        { value: "cancelled", label: "解約" },
    ] as const;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const name = e.target.name as keyof CompanyInfoTypes;
        const value = e.target.value;

        setForm((prev: CompanyInfoTypes) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleFetchAddress = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();

        try {
            const result = await fetchAddress(form.zipcode);

            setForm((prev) => ({
                ...prev,
                ...result,
            }));

            setMsg("");
        } catch (err) {
            setMsg((err as Error).message);
        }
    };

    const handleChangePref = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setForm((prev) => ({
            ...prev,
            prefecture: e.target.value,
        }))
    }

    const handleAddCompany = async () => {
        const res = await fetch("http://localhost:3000/api/companies", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(form),
        })

        await res.json();
    }

    useEffect(() => {
        const fetchCompany = async () => {
            const res = await fetch("http://localhost:3000/api/companies/1");
            const data = await res.json();

            setForm(data);
        }

        fetchCompany();
    }, []);

    return (
        <div className="mb-8">
            <div className="bg-sky-100 m-auto max-w-lg border rounded-2xl pb-8 my-8">
            <h1 className="text-3xl text-center text-black p-6">会社登録</h1>
                <div className="bg-white m-auto max-w-md border rounded-2xl p-4">
                    <form className="flex flex-col items-center gap-4">
                        <div className="flex flex-col w-64 sm:w-72 md:w-96">
                            <p className="text-left mb-2">会社名</p>
                            <input
                                type="text"
                                name="companyName"
                                value={form.companyName}
                                onChange={handleChange}
                                className="bg-white p-2 ring-1 ring-gray-300 rounded-md"
                            />
                        </div>
                        <div className="flex flex-col w-64 sm:w-72 md:w-96">
                            <p className="text-left mb-2">郵便番号</p>
                            <input
                                name="zipcode"
                                type="text"
                                value={form.zipcode}
                                onChange={handleChange}
                                placeholder="0123456"
                                className="bg-white p-2 ring-1 ring-gray-300 rounded-md"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={handleFetchAddress}
                            className="bg-gray-50 p-1 ring-1 ring-gray-300"
                        >
                            住所自動入力
                        </button>
                        { msg ?? <p className="text-red-500">{msg}</p>}
                        <div className="flex flex-col w-64 sm:w-72 md:w-96">
                            <select
                                onChange={handleChangePref}
                                className="max-w-24 bg-gray-100"
                            >
                                {PREFECTURES.map((pref) => (
                                    <option key={pref} value={pref}>
                                        {pref}
                                    </option>
                                ))}
                            </select>
                            <p className="text-left my-2">都道府県</p>
                            <input
                                type="text"
                                name="prefecture"
                                value={form.prefecture}
                                onChange={handleChange}
                                className="bg-white p-2 ring-1 ring-gray-300 rounded-md"
                            />
                            
                        </div>
                        <div className="flex flex-col w-64 sm:w-72 md:w-96">
                            <p className="text-left mb-2">市区町村</p>
                            <input
                                type="text"
                                name="shikutyouson"
                                value={form.city}
                                onChange={handleChange}
                                className="bg-white p-2 ring-1 ring-gray-300 rounded-md"
                            />
                        </div>
                        <div className="flex flex-col w-64 sm:w-72 md:w-96">
                            <p className="text-left mb-2">その他の住所</p>
                            <input
                                type="text"
                                name="streetAddress"
                                value={form.otherAddress}
                                onChange={handleChange}
                                className="bg-white p-2 ring-1 ring-gray-300 rounded-md"
                            />
                        </div>
                        <div className="flex flex-col w-64 sm:w-72 md:w-96">
                            <p className="text-left mb-2">アパートマンション名</p>
                            <input
                                type="text"
                                name="buildingName"
                                value={form.buildingName}
                                onChange={handleChange}
                                className="bg-white p-2 ring-1 ring-gray-300 rounded-md"
                            />
                        </div>
                        <div className="flex flex-col w-64 sm:w-72 md:w-96">
                            <p className="text-left mb-2">電話番号</p>
                            <input
                                type="text"
                                name="phoneNumber"
                                value={form.phoneNumber}
                                onChange={handleChange}
                                className="bg-white p-2 ring-1 ring-gray-300 rounded-md"
                            />
                        </div>
                        {form.email.map((email, index) => (
                            <div
                                key={index}
                                className="flex flex-col w-64 sm:w-72 md:w-96"
                            >
                                <p className="text-left mb-2">メールアドレス</p>
                                <input
                                    value={email}
                                    onChange={(e) => {
                                        const newEmails = [...form.email];
                                        newEmails[index] = e.target.value;
                                        setForm((prev) => ({
                                            ...prev,
                                            email: newEmails,
                                        }));
                                    }}
                                    className="bg-white p-2 ring-1 ring-gray-300 rounded-md"
                                />
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={() => setForm((prev) => ({
                                ...prev,
                                email: [...prev.email, ""],
                            }))}
                            className="bg-gray-50 p-1 ring-1 ring-gray-300"
                        >
                            ＋メールアドレスを追加
                        </button>
                        <div className="flex flex-col w-64 sm:w-72 md:w-96">
                            <p className="text-left mb-2">契約日</p>
                            <input
                                type="text"
                                name="contractDate"
                                value={form.contractDate}
                                onChange={handleChange}
                                className="bg-white p-2 ring-1 ring-gray-300 rounded-md"
                            />
                        </div>
                        {form.status === "cancelled"
                        ? (
                            <div className="flex flex-col w-64 sm:w-72 md:w-96">
                                <p className="text-left mb-2">解約日</p>
                                <input
                                    type="text"
                                    name="cancellationDate"
                                    value={form.cancellationDate}
                                    onChange={handleChange}
                                    className="bg-white p-2 ring-1 ring-gray-300 rounded-md"
                                />
                            </div>
                        ) : null}
                        <div className="text-left self-start mt-2">
                            <p className="ml-4">契約状態</p>
                        </div>
                        <div className="mb-4">
                            {contractStatusOptions.map((option) => (
                                <label 
                                    key={option.value}
                                    className="text-black mx-2"
                                >
                                    <input
                                        type="radio"
                                        name="status"
                                        value={option.value}
                                        checked={form.status === option.value}
                                        onChange={handleChange}
                                    />
                                        {option.label}
                                </label>
                            ))}
                        </div>
                        <button
                            onClick={handleAddCompany}
                            className="bg-blue-500 px-3 py-2 text-white rounded"
                        >
                            登録
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}