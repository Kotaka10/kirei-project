import type { CompanyInfoTypes } from "../register/companyInfoTypes";
import { useEffect, useState } from "react";

export default function CompanyList() {
    const [companies, setCompanies] = useState<CompanyInfoTypes[]>([]);

    useEffect(() => {
        const fetchCompanies = async () => {
            const res = await fetch("http://localhost:3000/api/companies");
            const data = await res.json();

            setCompanies(data);
        }

        fetchCompanies();
    }, []);

    return(
        <div className="flex flex-col items-center justify-center mt-24">
            <table className="w-fit border border-black">
                <thead>
                    <tr className="flex justify-between gap-12">
                        <th>会社名</th>
                        <th>都道府県</th>
                        <th>郵便番号</th>
                        <th>契約状態</th>
                    </tr>
                </thead>
                <tbody>
                    {companies.map((company) => (
                        <tr
                            key={company.id}
                            className="flex justify-between gap-12"
                        >
                            <td>{company.companyName}</td>
                            <td>{company.prefecture}</td>
                            <td>{company.zipcode}</td>
                            <td>{company.status}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}