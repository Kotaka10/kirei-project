

export default function userItemList() {
    const handleFindItem = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const input = e.target.value;

        if (!input) return [];

        const res = await fetch("http://localhost:3000/api/item");
        const data = await res.json();

        const results = data.filter((item: { itemName: string }) =>
            item.itemName.toLocaleLowerCase().includes(input.toLocaleLowerCase())
        );

        return results;
    }
}