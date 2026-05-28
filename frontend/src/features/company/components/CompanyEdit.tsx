import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import type { CompanyInfoTypes } from "../../../../../shared/types/CompanyInfoTypes";
import { useNavigate } from "react-router-dom";

const fieldCls = "flex flex-col gap-1";
const labelCls = "text-xs font-semibold text-gray-500 uppercase tracking-wide";
const inputCls = "w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-colors";

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

        if (id) { fetchCompany(); }
    }, [id]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        if (!formData) return;

        setFormData({
            ...formData,
            contractDate: formData.contractDate ? formData.contractDate.slice(0, 10) : "",
            emails: Array.isArray(formData.emails) ? formData.emails : [""],
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

    if (!formData) return (
        <div className="bg-gray-50 min-h-screen p-6 flex items-center justify-center">
            <p className="text-sm text-gray-500">読み込み中...</p>
        </div>
    );

    return (
        <div className="bg-gray-50 min-h-screen p-6">
            <div className="max-w-xl mx-auto">
                <h1 className="text-xl font-bold text-gray-800 pl-3 border-l-4 border-blue-400 mb-5">
                    会社情報編集
                </h1>

                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className={fieldCls}>
                            <label className={labelCls}>会社名</label>
                            <input
                                type="text"
                                name="companyName"
                                value={formData.companyName}
                                onChange={handleChange}
                                className={inputCls}
                            />
                        </div>

                        <div className={fieldCls}>
                            <label className={labelCls}>都道府県</label>
                            <input
                                type="text"
                                name="prefecture"
                                value={formData.prefecture}
                                onChange={handleChange}
                                className={inputCls}
                            />
                        </div>

                        <div className={fieldCls}>
                            <label className={labelCls}>郵便番号</label>
                            <input
                                type="text"
                                name="zipcode"
                                value={formData.zipcode}
                                onChange={handleChange}
                                className={inputCls}
                            />
                        </div>

                        <div className={fieldCls}>
                            <label className={labelCls}>契約状態</label>
                            <select
                                name="status"
                                value={formData.status || ""}
                                onChange={handleChange}
                                className={inputCls}
                            >
                                <option value="">契約状態を選択</option>
                                <option value="契約中">契約中</option>
                                <option value="商談中">商談中</option>
                                <option value="解約">解約</option>
                            </select>
                        </div>

                        <button
                            type="submit"
                            className="w-full rounded-lg px-4 py-2.5 mt-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition-colors"
                        >
                            更新する
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
