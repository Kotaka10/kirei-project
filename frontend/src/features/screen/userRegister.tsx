

export default function UserRegister() {
    

    return (
        <>
            <form className="">
                <div className="flex flex-col">
                    <p className="">名前</p>
                    <input
                        name="userName"
                        className=""
                    />
                </div>
                <div className="flex flex-col">
                    <p className="">TEL</p>
                    <input
                        name="phoneNumber"
                        className=""
                    />
                </div>
                <div className="flex flex-col">
                    <p className="">住所</p>
                    <input
                        name="address"
                        className=""
                    />
                </div>
                <div className="flex flex-col">
                    <p className="">発行日</p>
                    <input
                        name="publicationDate"
                        className=""
                    />
                </div>
                <div className="flex flex-col">
                    <p className="">有効期限</p>
                    <input
                        name="expirationDate"
                        className=""
                    />
                </div>
                <div className="flex flex-col">
                    <p className="">備考欄</p>
                    <input
                        name="notes"
                        className=""
                    />
                </div>
                <div className="flex flex-col">
                    <p className="">案件メモ</p>
                    <input
                        name="memo"
                        className=""
                    />
                </div>
            </form>
        </>
    )
}