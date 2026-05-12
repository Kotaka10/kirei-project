import { generateCustomers } from "./generateCustomers";
import { validateCustomers } from "./validate";
import { insertCustomers } from "./insert";

async function main () {
    const TOTAL = 100;
    const BATCH = 20;
    const allValid = [];

    for (let i = 0; i < TOTAL / BATCH; i++) {
        console.log(`生成中... ${i * 1}/${TOTAL / BATCH} バッチ`);
        const raw = await generateCustomers(BATCH);
        const { valid, invalid } = await validateCustomers(raw);
        allValid.push(...valid);

        if (invalid.length > 0) {
            console.warn(` NG: ${invalid.length} 件スキップ`);
        }
    }

    console.log(`バリデーション済み: ${allValid.length} 件`);
    await insertCustomers(allValid);
    console.log("完了!");
}

main().catch(console.error);