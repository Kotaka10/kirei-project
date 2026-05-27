import { PREFECTURES } from "../types/prefecturesTypes";
import { useRegisterForm } from "../hooks/useCompanyRegister";

const contractStatusOptions = [
    { value: "active", label: "契約中" },
    { value: "negotiating", label: "商談中" },
    { value: "cancelled", label: "解約" },
] as const;

const fieldCls = "flex flex-col gap-1";
const labelCls = "text-xs font-semibold text-gray-500 uppercase tracking-wide";
const inputCls = "w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-colors";

function SectionLabel({ children }: { children: string }) {
    return (
        <div className="flex items-center gap-3 pt-1">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{children}</span>
            <div className="h-px flex-1 bg-gray-100" />
        </div>
    );
}

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
        <div className="bg-gray-50 min-h-screen p-6">
            <div className="max-w-xl mx-auto">
                <h1 className="text-xl font-bold text-gray-800 pl-3 border-l-4 border-blue-400 mb-5">
                    会社登録
                </h1>

                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">

                    <div className={fieldCls}>
                        <label className={labelCls}>会社名</label>
                        <input type="text" name="companyName" value={form.companyName} onChange={handleChange} className={inputCls} />
                    </div>

                    <SectionLabel>住所</SectionLabel>

                    <div className={fieldCls}>
                        <label className={labelCls}>郵便番号</label>
                        <div className="flex gap-2">
                            <input type="text" name="zipcode" value={form.zipcode} onChange={handleChange} placeholder="例：1234567" className={inputCls} />
                            <button
                                type="button"
                                onClick={handleFetchAddress}
                                className="flex-shrink-0 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 whitespace-nowrap transition-colors"
                            >
                                住所自動入力
                            </button>
                        </div>
                        {msg && <p className="text-xs text-red-500">{msg}</p>}
                    </div>

                    <div className={fieldCls}>
                        <label className={labelCls}>都道府県</label>
                        <select name="prefecture" onChange={handleChange} className={inputCls}>
                            {PREFECTURES.map((pref) => (
                                <option key={pref} value={pref}>{pref}</option>
                            ))}
                        </select>
                    </div>

                    <div className={fieldCls}>
                        <label className={labelCls}>市区町村</label>
                        <input type="text" name="city" value={form.city} onChange={handleChange} className={inputCls} />
                    </div>

                    <div className={fieldCls}>
                        <label className={labelCls}>丁目・番地・号</label>
                        <input type="text" name="otherAddress" value={form.otherAddress} onChange={handleChange} className={inputCls} />
                    </div>

                    <div className={fieldCls}>
                        <label className={labelCls}>建物名・部屋番号（任意）</label>
                        <input type="text" name="buildingName" value={form.buildingName} onChange={handleChange} className={inputCls} />
                    </div>

                    <SectionLabel>連絡先</SectionLabel>

                    <div className={fieldCls}>
                        <label className={labelCls}>電話番号</label>
                        <input type="text" name="phoneNumber" value={form.phoneNumber} onChange={handleChange} placeholder="例：0312345678" className={inputCls} />
                    </div>

                    {form.emails.map((email, index) => (
                        <div key={index} className={fieldCls}>
                            <label className={labelCls}>
                                メールアドレス{index > 0 ? `（${index + 1}件目）` : ""}
                            </label>
                            <input
                                type="text"
                                name="email"
                                value={email}
                                onChange={(e) => handleChangeEmail(index, e.target.value)}
                                className={inputCls}
                            />
                        </div>
                    ))}

                    <button
                        type="button"
                        onClick={handleAddEmail}
                        className="flex items-center gap-1.5 text-sm font-medium text-blue-500 hover:text-blue-700 transition-colors"
                    >
                        ＋ メールアドレスを追加
                    </button>

                    <SectionLabel>契約情報</SectionLabel>

                    <div className={fieldCls}>
                        <label className={labelCls}>契約日</label>
                        <input type="date" name="contractDate" value={form.contractDate ?? ""} onChange={handleChange} className={inputCls} />
                    </div>

                    {form.status === "cancelled" && (
                        <div className={fieldCls}>
                            <label className={labelCls}>解約日</label>
                            <input type="date" name="cancellationDate" value={form.cancellationDate} onChange={handleChange} className={inputCls} />
                        </div>
                    )}

                    <div className={fieldCls}>
                        <label className={labelCls}>契約状態</label>
                        <div className="flex gap-2">
                            {contractStatusOptions.map((option) => (
                                <label
                                    key={option.value}
                                    className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm cursor-pointer transition-colors ${
                                        form.status === option.value
                                            ? "border-blue-300 bg-blue-50 text-blue-700 font-medium"
                                            : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="status"
                                        value={option.value}
                                        checked={form.status === option.value}
                                        onChange={handleChange}
                                        className="sr-only"
                                    />
                                    {option.label}
                                </label>
                            ))}
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleAddCompany}
                        className="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors mt-2"
                    >
                        登録する
                    </button>
                </div>
            </div>
        </div>
    );
}
