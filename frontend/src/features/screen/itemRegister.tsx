import { Link } from "react-router-dom";


export default function ItemRegister() {

    return (
        <>
            <div className="bg-slate-100 p-8 my-12 rounded-xl max-w-lg mx-auto">
            <h1 className="text-3xl text-center pb-6">商品登録</h1>
                <form className="flex flex-col items-center justify-center gap-10 max-w-md mx-auto bg-white rounded-xl p-6">
                    <div className="flex flex-col w-64 sm:w-72 md:w-96 pt-4">
                        <p className="pb-2 text-gray-900">商品内容</p>
                        <textarea
                            name="content"
                            className="h-32 bg-white p-2 ring-1 ring-gray-300 rounded-md"
                        />
                    </div>
                    <div className="flex flex-col w-64 sm:w-72 md:w-96">
                        <p className="pb-2 text-gray-900">数量</p>
                        <input
                            type="text"
                            name="quantity"
                            className="bg-white p-2 ring-1 ring-gray-300 rounded-md"
                        />
                    </div>
                    <div className="flex flex-col w-64 sm:w-72 md:w-96">
                        <p className="pb-2 text-gray-900">単位</p>
                        <input
                            type="text"
                            name="unit"
                            placeholder="例）個、本、枚、g、kg、ml、l など"
                            className="bg-white p-2 ring-1 ring-gray-300 rounded-md"
                        />
                    </div>
                    <div className="flex flex-col w-64 sm:w-72 md:w-96">
                        <p className="pb-2 text-gray-900">単価</p>
                        <div className="relative w-64 sm:w-72 md:w-96">
                            <input
                                type="text"
                                name="unit-price"
                                className="w-full bg-white p-2 ring-1 ring-gray-300 rounded-md"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                                円
                            </span>
                        </div>
                    </div>
                    <div className="flex flex-col pb-4">
                        <p className="pb-2 text-gray-900">金額</p>
                        <div className="relative w-64 sm:w-72 md:w-96">
                            <input  
                                type="text"
                                name="price"
                                className="w-full bg-white p-2 ring-1 ring-gray-300 rounded-md"
                            />
                            <span className="absolute right-3 top-1/2ight-3 top-1/2 -translate-y-1/2 text-gray-500">
                                円
                            </span>
                        </div>
                    </div>
                    <Link
                        to="/user-register"
                        className="text-blue-500 underline hover:text-blue-700"
                    >
                        ユーザー登録が済んでいない方はこちら
                    </Link>
                </form>
            </div>
        </>
    )
}