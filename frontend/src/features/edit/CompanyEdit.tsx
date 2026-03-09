import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import type { CompanyInfoTypes } from "../register/types/companyInfoTypes";
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
            console.log("id", id);
            const res = await fetch(`http://localhost:3000/api/companies/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            });
            console.log("res", res);

            if (!res.ok) {
                alert("更新に失敗しました。");
                return;
            }

            await res.json();
            alert("更新しました。");
            navigate("/list");
        } catch (error) {
            console.error(error);
            alert("通信の問題が発生しました。");
        }
    };

    if (!formData) return <div>Loading...</div>;

    return (
        <div className="flex flex-col items-center justify-center mt-24">
            <h1 className="text-2xl mb-4">会社情報編集</h1>
            <form onSubmit={handleSubmit} className="w-full max-w-md">
                <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    className="mb-4 p-2 border border-black rounded w-full"
                />
                <input
                    type="text"
                    name="prefecture"
                    value={formData.prefecture}
                    onChange={handleChange}
                    className="mb-4 p-2 border border-black rounded w-full"
                />
                <input
                    type="text"
                    name="zipcode"
                    value={formData.zipcode}
                    onChange={handleChange}
                    className="mb-4 p-2 border border-black rounded w-full"
                />
                <select
                    name="status"
                    value={formData.status || ""}
                    onChange={handleChange}
                    className="mb-4 p-2 border border-black rounded w-full"
                >
                    <option>契約状態を選択</option>
                    <option value="契約中">契約中</option>
                    <option value="商談中">商談中
                    </option>
                    <option value="解約">解約</option>
                </select>
                <button
                    type="submit"
                    className="px-4 py-2 bg-green-500 text-white rounded"
                >
                    更新
                </button>
            </form>
        </div>
    );
}