import { Link } from "react-router-dom";


export default function UserRegister() {
    

    return (
        <>
            <form className="bg-green-100 p-8 m-auto max-w-lg rounded-xl mt-12">
            <h1 className="text-3xl text-center pb-6">ユーザー登録</h1>
                <div className="bg-white p-4 rounded-xl flex flex-col items-center justify-center gap-8">
                    <div className="flex flex-col w-64 sm:w-72 md:w-96">
                        <p className="mb-2">名前</p>
                        <input
                            type="text"
                            name="userName"
                            className="bg-white p-2 ring-1 ring-black rounded-md"
                        />
                    </div>
                    <div className="flex flex-col w-64 sm:w-72 md:w-96">
                        <p className="mb-2">TEL</p>
                        <input
                            type="text"
                            name="phoneNumber"
                            className="bg-white p-2 ring-1 ring-black rounded-md"
                        />
                    </div>
                    <div className="flex flex-col w-64 sm:w-72 md:w-96">
                        <p className="mb-2">住所</p>
                        <input
                            type="text"
                            name="address"
                            className="bg-white p-2 ring-1 ring-black rounded-md"
                        />
                    </div>
                    <div className="flex flex-col w-64 sm:w-72 md:w-96">
                        <p className="mb-2">発行日</p>
                        <input
                            type="text"
                            name="publicationDate"
                            className="bg-white p-2 ring-1 ring-black rounded-md"
                        />
                    </div>
                    <div className="flex flex-col w-64 sm:w-72 md:w-96">
                        <p className="mb-2">有効期限</p>
                        <input
                            type="text"
                            name="expirationDate"
                            className="bg-white p-2 ring-1 ring-black rounded-md"
                        />
                    </div>
                    <div className="flex flex-col w-64 sm:w-72 md:w-96">
                        <p className="mb-2">備考欄</p>
                        <input
                            type="text"
                            name="notes"
                            className="bg-white p-2 ring-1 ring-black rounded-md"
                        />
                    </div>
                    <div className="flex flex-col w-64 sm:w-72 md:w-96">
                        <p className="mb-2">案件メモ</p>
                        <input
                            type="text"
                            name="memo"
                            className="bg-white p-2 ring-1 ring-black rounded-md"
                        />
                    </div>
                    <Link
                        to="/item-register"
                        className="text-blue-500 underline hover:text-blue-700"
                    >
                        商品登録が済んでない方はこちら
                    </Link>
                </div>
            </form>    
        </>
    )
}