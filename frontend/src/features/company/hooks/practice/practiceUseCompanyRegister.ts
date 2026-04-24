import { useEffect, useState } from "react"
import type { CompanyInfoTypes } from "../../../../../../shared/types/CompanyInfoTypes"
import { useAddress } from "../useAddress";

export const practiceUseCompanyRegister = () => {
    const [form, setForm] = useState<CompanyInfoTypes>({
        id: 0,
        companyName: "",
        zipcode: "",
        prefecture: "", 
        city: "",
        otherAddress: "",
        buildingName: "",
        phoneNumber: "",
        emails: [""],
        contractDate: "",
        status: "",
        cancellationDate: "",
    });

    const [msg, setMsg] = useState("");
    const { fetchAddress } = useAddress();

    useEffect(() => {
        const fetchCompany = async () => {
            const res = await fetch("http://localhost:3000/api/companies/1");
            if (!res.ok) {
                alert("会社の取得に失敗しました");
            }

            const data = await res.json();
            setForm(data);
        }

        fetchCompany();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleFetchAddress = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();

        try {
            const fetchedAddress = await fetchAddress(form.zipcode);

            setForm((prev) => ({ ...prev, ...fetchedAddress }));
            setMsg("");
        } catch (err) {
            console.error(err);

            if (err instanceof Error) {
                setMsg(err.message);
            } else {
                setMsg("住所の取得に失敗しました");
            }
        }
    };

    const handleChangeEmail = (index: number, value: string) => {
        const newEmails = [...form.emails];
        newEmails[index] = value;
        setForm((prev) => ({ ...prev, emails: newEmails }));
    };

    const handleAddEmail = () => {
        setForm((prev) => ({ ...prev, emails: [...prev.emails, ""]}));
    };

    const statusLabelMap: Record<string, string> = {
        active: "契約中",
        negotiating: "商談中",
        cancelled: "解約済み"
    };

    const handleAddCompany = async () => {
        const payload = {
            ...form,
            status: statusLabelMap[form.status] ?? form.status
        };
        
        const res = await fetch("http://localhost:3000/api/companies", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        await res.json();
        alert(`${form.companyName}を登録しました`);
    }

    return {
        form,
        msg,
        handleChange,
        handleFetchAddress,
        handleChangeEmail,
        handleAddEmail,
        handleAddCompany,
    };
}