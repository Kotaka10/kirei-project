import type { CompanyInfoTypes } from "../../../../../shared/types/companyInfoTypes";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function CompanyList() {
    const navigate = useNavigate();

    const [companies, setCompanies] = useState<CompanyInfoTypes[]>([]);
    const [keyword, setKeyword] = useState("");

    const filteredCompanies = companies.filter((company) =>
        company.companyName
            .toLowerCase()
            .includes(keyword.toLowerCase())
    );

    useEffect(() => {
        const fetchCompanies = async () => {
            const res = await fetch("http://localhost:3000/api/companies");
            const data = await res.json();

            setCompanies(data);
        }

        fetchCompanies();
    }, []);

    const handleEdit = async (id: number) => {
        navigate(`/company/edit/${id}`);
    };

    return(
        <div className="bg-sky-100 p-8 max-w-3xl m-auto my-16 rounded-xl">
            <h1 className="text-center text-3xl p-6">会社一覧</h1>
            <div className="bg-sky-100 pb-8 flex flex-col items-center justify-center">
                <input
                    type="text"
                    placeholder="会社名で検索"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    className="mb-4 p-2 border border-black rounded"
                />
                <table className="w-[650px] table-fixed border border-black">
                    <thead>
                        <tr className="border border-black">
                            <th className="px-2 py-2 text-left">会社名</th>
                            <th className="px-2 py-2 text-left">都道府県</th>
                            <th className="px-2 py-2 text-left">郵便番号</th>
                            <th className="px-2 py-2 text-left">契約状態</th>
                            <th className="px-2 py-2 text-left">操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredCompanies.map((company) => (
                            <tr
                                key={company.id}
                                className="border border-black"
                            >
                                <td className="px-2 py-2 text-left">{company.companyName}</td>
                                <td className="px-2 py-2 text-left">{company.prefecture}</td>
                                <td className="px-2 py-2 text-left">{company.zipcode}</td>
                                <td className="px-2 py-2 text-left">{company.status}</td>
                                <td>
                                    <button
                                        onClick={() => handleEdit(company.id)}
                                        className="px-4 py-2 bg-blue-500 text-white rounded"
                                    >
                                        編集
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}