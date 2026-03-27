import { PREFECTURES } from "../types/prefecturesTypes";
import { useRegisterForm } from "../hooks/useCompanyRegister";

const contractStatusOptions = [
    { value: "active", label: "契約中" },
    { value: "negotiating", label: "商談中" },
    { value: "cancelled", label: "解約" },
] as const;

export default function CompanyRegister() {
    const {
        form,
        msg,
        handleChange,
        handleFetchAddress,
        handleChangeEmail,
        handleAddEmail,
        handleAddCompany,
    } = useRegisterForm();

    return (
        <div className="mb-8">
            <div className="bg-sky-100 m-auto max-w-lg border rounded-2xl pb-8 my-8">
            <h1 className="text-3xl text-center text-black p-6">会社登録</h1>
                <div className="bg-white m-auto max-w-md border rounded-2xl p-4">
                    <form className="flex flex-col items-center gap-4">
                        <div className="flex flex-col w-64 sm:w-72 md:w-96">
                            <label htmlFor="companyName" className="mb-2 text-sm font-medium text-gray-700">会社名</label>
                            <input
                                type="text"
                                name="companyName"
                                value={form.companyName}
                                onChange={handleChange}
                                className="bg-white p-2 ring-1 ring-gray-300 rounded-md"
                            />
                        </div>
                        <div className="flex flex-col w-64 sm:w-72 md:w-96">
                            <label htmlFor="zipcode" className="mb-2 text-sm font-medium text-gray-700">郵便番号</label>
                            <input
                                type="text"
                                name="zipcode"
                                value={form.zipcode}
                                onChange={handleChange}
                                placeholder="0123456"
                                className="bg-white p-2 ring-1 ring-gray-300 rounded-md"
                            />
                        </div>
                        <button
                            type="submit"
                            onClick={handleFetchAddress}
                            className="rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-sm text-sky-700 hover:bg-sky-100"
                        >
                            住所自動入力
                        </button>
                        {msg && <p className="text-red-500">{msg}</p>}
                        <div className="flex flex-col w-64 sm:w-72 md:w-96">
                            <label htmlFor="prefecture" className="mb-2 text-sm font-medium text-gray-700">都道府県</label>
                            <select
                                name="prefecture"
                                onChange={handleChange}
                                className="max-w-24 bg-gray-100"
                            >
                                {PREFECTURES.map((pref) => (
                                    <option key={pref} value={pref}>
                                        {pref}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex flex-col w-64 sm:w-72 md:w-96">
                            <label htmlFor="city" className="mb-2 text-sm font-medium text-gray-700">市区町村</label>
                            <input
                                type="text"
                                name="city"
                                value={form.city}
                                onChange={handleChange}
                                className="bg-white p-2 ring-1 ring-gray-300 rounded-md"
                            />
                        </div>
                        <div className="flex flex-col w-64 sm:w-72 md:w-96">
                            <label htmlFor="otherAddress" className="mb-2 text-sm font-medium text-gray-700">その他の住所</label>
                            <input
                                type="text"
                                name="otherAddress"
                                value={form.otherAddress}
                                onChange={handleChange}
                                className="bg-white p-2 ring-1 ring-gray-300 rounded-md"
                            />
                        </div>
                        <div className="flex flex-col w-64 sm:w-72 md:w-96">
                            <label htmlFor="buildingName" className="mb-2 text-sm font-medium text-gray-700">アパートマンション名</label>
                            <input
                                type="text"
                                name="buildingName"
                                value={form.buildingName}
                                onChange={handleChange}
                                className="bg-white p-2 ring-1 ring-gray-300 rounded-md"
                            />
                        </div>
                        <div className="flex flex-col w-64 sm:w-72 md:w-96">
                            <label htmlFor="phoneNumber" className="mb-2 text-sm font-medium text-gray-700">電話番号</label>
                            <input
                                type="text"
                                name="phoneNumber"
                                value={form.phoneNumber}
                                onChange={handleChange}
                                className="bg-white p-2 ring-1 ring-gray-300 rounded-md"
                            />
                        </div>
                        {form.emails.map((email, index) => (
                            <div
                                key={index}
                                className="flex flex-col w-64 sm:w-72 md:w-96"
                            >
                                <label htmlFor="email" className="mb-2 text-sm font-medium text-gray-700">メールアドレス</label>
                                <input
                                    type="text"
                                    name="email"
                                    value={email}
                                    onChange={(e) => handleChangeEmail(index, e.target.value)}
                                    className="bg-white p-2 ring-1 ring-gray-300 rounded-md"
                                />
                            </div>
                        ))}
                        <button
                            type="submit"
                            onClick={handleAddEmail}
                            className="rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-sm text-sky-700 hover:bg-sky-100"
                        >
                            ＋メールアドレスを追加
                        </button>
                        <div className="flex flex-col w-64 sm:w-72 md:w-96">
                            <label htmlFor="contractDate" className="mb-2 text-sm font-medium text-gray-700">契約日</label>
                            <input
                                type="date"
                                name="contractDate"
                                value={form.contractDate ?? ""}
                                onChange={handleChange}
                                className="bg-white p-2 ring-1 ring-gray-300 rounded-md"
                            />
                        </div>
                        {form.status === "cancelled" && (
                            <div className="flex flex-col w-64 sm:w-72 md:w-96">
                                <label htmlFor="cancellationDate" className="mb-2 text-sm font-medium text-gray-700">解約日</label>
                                <input
                                    type="date"
                                    name="cancellationDate"
                                    value={form.cancellationDate}
                                    onChange={handleChange}
                                    className="bg-white p-2 ring-1 ring-gray-300 rounded-md"
                                />
                            </div>
                        )}
                        <div className="text-left self-start mt-2">
                            <label htmlFor="status" className="mb-2 ml-4 text-sm font-medium text-gray-700">契約状態</label>
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
                            className="w-full rounded-lg text-white hover:bg-slate-800 bg-blue-500 px-4 py-3"
                        >
                            登録
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
