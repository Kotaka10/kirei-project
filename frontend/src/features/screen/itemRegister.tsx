

export default function ItemRegister() {

    return (
        <>
            <h1 className="text-3xl text-center p-6">商品登録</h1>
            <form className="flex flex-col items-center justify-center">
                <div className="">
                    <p className="">商品内容</p>
                    <input />
                </div>
                <div className="">
                    <p className="">数量</p>
                    <input />
                </div>
                <div className="">
                    <p className="">単位</p>
                    <input />
                </div>
                <div className="">
                    <p className="">単価</p>
                    <input />
                </div>
                <div className="">
                    <p className="">金額</p>
                    <input />
                </div>
            </form>
        </>
    )
}