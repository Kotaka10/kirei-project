import { Link } from "react-router-dom";


export default function ItemRegister() {

    return (
        <>
            <h1 className="text-3xl text-center p-6">商品登録</h1>
            <div className="bg-yellow-100 p-6 rounded-xl max-w-lg mx-auto">
                <form className="flex flex-col items-center justify-center gap-10 max-w-md mx-auto bg-white rounded-xl p-6">
                    <div className="flex flex-col w-64 sm:w-72 md:w-96 pt-4">
                        <p className="pb-2">商品内容</p>
                        <input
                            type="text"
                            name="content"
                            className="bg-white p-2 ring-1 ring-black rounded-md"
                        />
                    </div>
                    <div className="flex flex-col w-64 sm:w-72 md:w-96">
                        <p className="pb-2">数量</p>
                        <input
                            type="text"
                            name="quantity"
                            className="bg-white p-2 ring-1 ring-black rounded-md"
                        />
                    </div>
                    <div className="flex flex-col w-64 sm:w-72 md:w-96">
                        <p className="pb-2">単位</p>
                        <input
                            type="text"
                            name="unit"
                            className="bg-white p-2 ring-1 ring-black rounded-md"
                        />
                    </div>
                    <div className="flex flex-col w-64 sm:w-72 md:w-96">
                        <p className="pb-2">単価</p>
                        <input
                            type="text"
                            name="unit-price"
                            className="bg-white p-2 ring-1 ring-black rounded-md"
                        />
                    </div>
                    <div className="flex flex-col w-64 sm:w-72 md:w-96 pb-4">
                        <p className="pb-2">金額</p>
                        <input
                            type="text"
                            name="price"
                            className="bg-white p-2 ring-1 ring-black rounded-md"
                        />
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