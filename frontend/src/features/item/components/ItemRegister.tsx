import { Link } from "react-router-dom";

export default function ItemRegister() {


    return (
        <>
            <div className="bg-slate-100 p-8 rounded-xl mx-auto">
            <h1 className="text-3xl text-center pb-6">商品登録</h1>
                <form className="flex flex-col items-center justify-center gap-10 max-w-md mx-auto w-full bg-white rounded-2xl p-6 sm:p-8">
                    <div className="flex flex-col w-64 sm:w-72 md:w-96">
                        <label htmlFor="companyName" className="mb-2 text-sm font-medium text-gray-700">商品名</label>
                        <input
                            type="text"
                            name="itemName"
                            className="w-full rounded-md ring-1 ring-gray-300 px-3 py-2"
                        />
                    </div>
                    <div className="flex flex-col w-64 sm:w-72 md:w-96 pt-4">
                        <label htmlFor="companyName" className="mb-2 text-sm font-medium text-gray-700">商品内容</label>
                        <textarea
                            name="content"
                            className="h-32 w-full rounded-md ring-1 ring-gray-300 px-3 py-2"
                        />
                    </div>
                    <div className="flex flex-col w-64 sm:w-72 md:w-96">
                        <label htmlFor="companyName" className="mb-2 text-sm font-medium text-gray-700">数量</label>
                        <input
                            type="text"
                            name="quantity"
                            className="w-full rounded-md ring-1 ring-gray-300 px-3 py-2"
                        />
                    </div>
                    <div className="flex flex-col w-64 sm:w-72 md:w-96">
                        <label htmlFor="companyName" className="mb-2 text-sm font-medium text-gray-700">単位</label>
                        <input
                            type="text"
                            name="unit"
                            placeholder="例）個、本、枚、g、ml など"
                            className="w-full rounded-md ring-1 ring-gray-300 px-3 py-2"
                        />
                    </div>
                    <div className="flex flex-col w-64 sm:w-72 md:w-96">
                        <label htmlFor="companyName" className="mb-2 text-sm font-medium text-gray-700">単価</label>
                        <div className="relative w-64 sm:w-72 md:w-96">
                            <input
                                type="text"
                                name="unit-price"
                                className="w-full rounded-md ring-1 ring-gray-300 px-3 py-2"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                                円
                            </span>
                        </div>
                    </div>
                    <div className="flex flex-col pb-4">
                        <label htmlFor="companyName" className="mb-2 text-sm font-medium text-gray-700">金額</label>
                        <div className="relative w-64 sm:w-72 md:w-96">
                            <input  
                                type="text"
                                name="price"
                                className="w-full rounded-md ring-1 ring-gray-300 px-3 py-2"
                            />
                            <span className="absolute right-3 top-1/2ight-3 top-1/2 -translate-y-1/2 text-gray-500">
                                円
                            </span>
                        </div>
                    </div>
                    <button
                        type="submit"
                        className="w-full rounded-lg bg-slate-900 px-4 py-3 text-white hover:bg-slate-800"
                    >
                        商品を登録する
                    </button>
                    <Link
                        to="/item-list"
                        className="text-sm font-medium text-slate-700 underline underline-offset-4 hover:text-slate-900"
                    >
                        商品一覧ページ
                    </Link>
                    <Link
                        to="/user-register"
                        className="text-sm text-slate-500 underline underline-offset-4 hover:text-slate-700"
                    >
                        ユーザー登録が済んでいない方はこちら
                    </Link>
                </form>
            </div>
        </>
    )
}