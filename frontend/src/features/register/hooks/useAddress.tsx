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

    const result = data.results?.[0];

    if (!result) {
      throw new Error("住所取得失敗");
    }

    return {
      prefecture: result.address1,
      city: result.address2 + result.address3,
    };
  };

  return { fetchAddress };
}