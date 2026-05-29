import type { CompanyInfoTypes } from "../../../../../shared/types/CompanyInfoTypes";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const statusConfig: Record<string, { label: string; className: string }> = {
    active:      { label: "契約中", className: "bg-green-50 text-green-700 border border-green-200"  },
    negotiating: { label: "商談中", className: "bg-amber-50 text-amber-700 border border-amber-200" },
    cancelled:   { label: "解約",   className: "bg-rose-50 text-rose-600 border border-rose-200"    },
};

export default function CompanyList() {
    const navigate = useNavigate();
    const [companies, setCompanies] = useState<CompanyInfoTypes[]>([]);
    const [keyword, setKeyword] = useState("");

    const filteredCompanies = Array.isArray(companies)
        ? companies.filter((company) =>
            typeof company?.companyName === "string" &&
            company.companyName.toLowerCase().includes(keyword.toLowerCase())
        )
        : [];

    useEffect(() => {
        const fetchCompanies = async () => {
            try {
                const res = await fetch("http://localhost:3000/api/companies");
                if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
                const data = await res.json();
                setCompanies(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error("fetchCompanies error", error);
                setCompanies([]);
            }
        };
        fetchCompanies();
    }, []);

    return (
        <div className="bg-gray-50 min-h-screen p-6">
            <div className="max-w-3xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                        <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-100 text-xl shrink-0">🏢</span>
                        会社一覧
                    </h1>
                    <button
                        onClick={() => navigate("/register")}
                        className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
                    >
                        ＋ 新規登録
                    </button>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between p-4 border-b border-gray-100">
                        <input
                            type="text"
                            placeholder="会社名で検索..."
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            className="w-64 rounded-lg border border-gray-200 px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-colors"
                        />
                        <span className="text-sm text-gray-400">{filteredCompanies.length} 件</span>
                    </div>

                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100 text-left">
                                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">会社名</th>
                                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">都道府県</th>
                                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">郵便番号</th>
                                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">契約状態</th>
                                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredCompanies.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-5 py-10 text-center text-sm text-gray-400">
                                        該当する会社がありません
                                    </td>
                                </tr>
                            ) : (
                                filteredCompanies.map((company) => {
                                    const status = statusConfig[company.status];
                                    return (
                                        <tr key={company.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-5 py-3.5 font-medium text-gray-800">{company.companyName}</td>
                                            <td className="px-5 py-3.5 text-gray-600">{company.prefecture}</td>
                                            <td className="px-5 py-3.5 text-gray-600">{company.zipcode}</td>
                                            <td className="px-5 py-3.5">
                                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${status?.className ?? "bg-gray-100 text-gray-600"}`}>
                                                    {status?.label ?? company.status}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <button
                                                    onClick={() => navigate(`/company/edit/${company.id}`)}
                                                    className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                                                >
                                                    編集
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
