export function useAddress() {
  const fetchAddress = async (zipcode: string) => {
    if (!/^\d{7}$/.test(zipcode)) {
      throw new Error("有効な7桁の数字を入力してください。");
    }

    const res = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${zipcode}`);
    const data = await res.json();

    if (!data.results) {
      throw new Error(data.message);
    }

    return {
      prefecture: data.results[0].address1,
      city: data.results[0].address2 + data.results[0].address3,
    };
  };

  return { fetchAddress };
}