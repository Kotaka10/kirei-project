import { useNavigate, useParams } from "react-router-dom";
import type { CompanyInfoTypes } from "../../../../../../shared/types/CompanyInfoTypes";
import { useEffect, useState } from "react";

export default function practiceCompanyEdit() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [formData, setFormData] = useState<CompanyInfoTypes | null>(null);

    useEffect(() => {
        const fetchCompany = async () => {
            try {
                const res = await fetch(`http://localhost:3000/api/companies/${id}`);

                if (!res.ok) {
                    console.error("会社情報の取得に失敗しました");
                }

                const data = await res.json();
                setFormData(data);
            } catch (err) {
                console.error(err);
                alert("通信の問題が発生しました");
            }
        };

        fetchCompany();
    }, [id]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        if (!formData) {
            return;
        }

        setFormData({
             ...formData,
             contractDate: formData.contractDate ? formData?.contractDate.slice(0, 10) : "",
             emails: Array.isArray(formData.emails) ? formData.emails : [""],
             [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        try {
            const res = await fetch(`http://localhost:3000/api/companies/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            })

            if (!res.ok) {
                throw new Error("更新に失敗しました");
            }

            await res.json();
            alert("更新しました");
            navigate("/list");
        } catch (err) {
            console.error(err);
            alert("通信の問題が発生しました");
        }
    };

    if (!formData) return <div>Loading...</div>;
}