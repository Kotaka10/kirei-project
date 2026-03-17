import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import type { CompanyInfoTypes } from "../../../../../shared/types/companyInfoTypes";
import { useNavigate } from "react-router-dom";

export default function CompanyEdit() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [formData, setFormData] = useState<CompanyInfoTypes | null>(null);

    useEffect(() => {
        const fetchCompany = async () => {
            try {
                const res = await fetch(`http://localhost:3000/api/companies/${id}`);
                
                if (!res.ok) {
                    alert("会社情報の取得に失敗しました。");
                    return;
                }

                const data = await res.json();
                setFormData(data);
            } catch (error) {
                console.error(error);
                alert("通信の問題が発生しました。");
            }
        }

        if (id) {fetchCompany()};
    }, [id]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        if (!formData) return;

        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        try {
            const res = await fetch(`http://localhost:3000/api/companies/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(formData),
            });

            if (!res.ok) {
                throw new Error("更新に失敗しました。");
            }

            await res.json();
            alert("更新しました。");
            navigate("/list");
        } catch (error) {
            console.error("error", error);
            alert("通信の問題が発生しました。");
        }
    };

    if (!formData) return <div>Loading...</div>;

    return (
        <div className="bg-sky-100 max-w-xl mx-auto flex flex-col items-center p-12 mt-16 rounded-xl">
            <h1 className="text-3xl p-6">会社情報編集</h1>
            <form onSubmit={handleSubmit} className="w-full max-w-md">
                <label htmlFor="companyName" className="text-sm font-medium text-gray-700">会社名</label>
                <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    className="my-2 p-2 border border-black rounded w-full"
                />
                <label htmlFor="companyName" className="mb-2 text-sm font-medium text-gray-700">都道府県</label>
                <input
                    type="text"
                    name="prefecture"
                    value={formData.prefecture}
                    onChange={handleChange}
                    className="my-2 p-2 border border-black rounded w-full"
                />
                <label htmlFor="companyName" className="mb-2 text-sm font-medium text-gray-700">郵便番号</label>
                <input
                    type="text"
                    name="zipcode"
                    value={formData.zipcode}
                    onChange={handleChange}
                    className="my-2 p-2 border border-black rounded w-full"
                />
                <label htmlFor="companyName" className="mb-2 text-sm font-medium text-gray-700">契約状態</label>
                <select
                    name="status"
                    value={formData.status || ""}
                    onChange={handleChange}
                    className="my-2 p-2 border border-black rounded w-full"
                >
                    <option>契約状態を選択</option>
                    <option value="契約中">契約中</option>
                    <option value="商談中">商談中
                    </option>
                    <option value="解約">解約</option>
                </select>
                <div className="flex justify-end">
                    <button
                        type="submit"
                        className="w-full rounded-lg x-4 py-3 mt-4 bg-green-500 text-white"
                    >
                        更新
                    </button>
                </div>
            </form>
        </div>
    );
}