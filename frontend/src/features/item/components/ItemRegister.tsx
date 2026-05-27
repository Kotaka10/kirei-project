import { Link } from "react-router-dom";
import useItemRegister from "./hooks/useItemRegister";

const fieldCls = "flex flex-col gap-1";
const labelCls = "text-xs font-semibold text-gray-500 uppercase tracking-wide";
const inputCls = "w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-colors";

export default function ItemRegister() {
    const {
        form,
        msg,
        isLoading,
        handleChange,
        handleRegister
    } = useItemRegister();

    const subtotal = Number(form.quantity) * Number(form.unitPrice);
    const tax = subtotal / 10;
    const totalPrice = tax + subtotal;

    return (
        <div className="bg-gray-50 min-h-screen p-6">
            <div className="max-w-xl mx-auto">
                <h1 className="text-xl font-bold text-gray-800 pl-3 border-l-4 border-teal-400 mb-5">
                    商品登録
                </h1>

                <form onSubmit={handleRegister} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">

                    <div className={fieldCls}>
                        <label className={labelCls}>商品名</label>
                        <input type="text" name="itemName" value={form.itemName} onChange={handleChange} className={inputCls} />
                    </div>

                    <div className={fieldCls}>
                        <label className={labelCls}>商品の説明</label>
                        <textarea
                            name="description"
                            value={form.description}
                            onChange={handleChange}
                            rows={3}
                            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-colors resize-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className={fieldCls}>
                            <label className={labelCls}>数量</label>
                            <input type="text" name="quantity" value={form.quantity} onChange={handleChange} className={inputCls} />
                        </div>
                        <div className={fieldCls}>
                            <label className={labelCls}>単位</label>
                            <input type="text" name="unit" value={form.unit} onChange={handleChange} placeholder="個・本・枚 など" className={inputCls} />
                        </div>
                    </div>

                    <div className={fieldCls}>
                        <label className={labelCls}>単価（円）</label>
                        <div className="relative">
                            <input type="text" name="unitPrice" value={form.unitPrice} onChange={handleChange} className={inputCls} />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none">円</span>
                        </div>
                    </div>

                    {/* 金額サマリー */}
                    <div className="rounded-xl bg-gray-50 border border-gray-200 px-4 py-4 space-y-2.5">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">金額確認</p>
                        <div className="flex justify-between text-sm text-gray-600">
                            <span>小計</span>
                            <span className="font-medium">{subtotal.toLocaleString()} 円</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-500">
                            <span>消費税（10%）</span>
                            <span>{tax.toLocaleString()} 円</span>
                        </div>
                        <div className="flex justify-between text-sm font-bold text-gray-800 pt-2.5 border-t border-gray-200">
                            <span>合計</span>
                            <span>{totalPrice.toLocaleString()} 円</span>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 transition-colors disabled:opacity-60"
                    >
                        {isLoading ? "登録中..." : "商品を登録する"}
                    </button>

                    {msg && <p className="text-center text-sm text-teal-600">{msg}</p>}

                    <div className="flex justify-center gap-5 pt-1">
                        <Link to="/item-list" className="text-xs text-gray-500 hover:text-gray-700 underline underline-offset-4">
                            商品一覧
                        </Link>
                        <Link to="/user-register" className="text-xs text-gray-500 hover:text-gray-700 underline underline-offset-4">
                            ユーザー登録
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
