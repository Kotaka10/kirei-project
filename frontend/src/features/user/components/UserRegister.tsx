import { Link } from "react-router-dom";
import useUserRegister from "./hooks/useUserRegister";

const fieldCls = "flex flex-col gap-1.5";
const labelCls = "text-sm font-medium text-gray-600";
const inputCls = "w-full rounded-lg border border-gray-200 px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-colors";

function SectionLabel({ children }: { children: string }) {
    return (
        <div className="flex items-center gap-3 pt-1">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{children}</span>
            <div className="h-px flex-1 bg-gray-100" />
        </div>
    );
}

export default function UserRegister() {
    const {
        form,
        msg,
        isLoading,
        handleChange,
        handleFetchAddress,
        handleRegister
    } = useUserRegister();

    return (
        <div className="bg-gray-50 min-h-screen p-6">
            <div className="max-w-xl mx-auto">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3 mb-6">
                    <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-100 text-xl shrink-0">👤</span>
                    ユーザー登録
                </h1>

                <form onSubmit={handleRegister} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">

                    <div className={fieldCls}>
                        <label className={labelCls}>氏名</label>
                        <input type="text" name="name" value={form.name} onChange={handleChange} placeholder="例：山田 太郎" className={inputCls} />
                    </div>

                    <div className={fieldCls}>
                        <label className={labelCls}>電話番号</label>
                        <input type="text" name="phoneNumber" value={form.phoneNumber} onChange={handleChange} placeholder="例：0312345678" className={inputCls} />
                    </div>

                    <SectionLabel>住所</SectionLabel>

                    <div className={fieldCls}>
                        <label className={labelCls}>郵便番号</label>
                        <div className="flex gap-2">
                            <input type="text" name="zipcode" value={form.zipcode} onChange={handleChange} placeholder="例：1234567" className={inputCls} />
                            <button
                                type="button"
                                onClick={handleFetchAddress}
                                className="flex-shrink-0 rounded-lg border border-gray-200 px-3 py-3 text-base text-gray-600 hover:bg-gray-50 whitespace-nowrap transition-colors"
                            >
                                住所自動入力
                            </button>
                        </div>
                    </div>

                    <div className={fieldCls}>
                        <label className={labelCls}>都道府県</label>
                        <input type="text" name="prefecture" value={form.prefecture} onChange={handleChange} className={inputCls} />
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

                    <SectionLabel>その他の情報</SectionLabel>

                    <div className="grid grid-cols-2 gap-3">
                        <div className={fieldCls}>
                            <label className={labelCls}>発行日</label>
                            <input type="date" name="publicationDate" value={form.publicationDate} onChange={handleChange} className={inputCls} />
                        </div>
                        <div className={fieldCls}>
                            <label className={labelCls}>有効期限</label>
                            <input type="date" name="expirationDate" value={form.expirationDate} onChange={handleChange} className={inputCls} />
                        </div>
                    </div>

                    <div className={fieldCls}>
                        <label className={labelCls}>備考</label>
                        <input type="text" name="notes" value={form.notes} onChange={handleChange} className={inputCls} />
                    </div>

                    <div className={fieldCls}>
                        <label className={labelCls}>メモ</label>
                        <input type="text" name="memo" value={form.memo} onChange={handleChange} className={inputCls} />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-base font-semibold text-white hover:bg-indigo-700 transition-colors disabled:opacity-60 mt-2"
                    >
                        {isLoading ? "登録中..." : "ユーザーを登録する →"}
                    </button>

                    {msg && <p className="text-center text-sm text-blue-600">{msg}</p>}

                    <p className="text-center text-xs text-gray-400">
                        商品が未登録の場合は
                        <Link to="/item-register" className="text-blue-500 hover:text-blue-700 font-medium ml-1">
                            商品登録
                        </Link>
                        から先に登録できます
                    </p>
                </form>
            </div>
        </div>
    );
}
