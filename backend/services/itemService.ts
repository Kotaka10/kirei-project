import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataPath = path.join(__dirname, "../data/items.json");

export const addItem = (item: any) => {
    const items = JSON.parse(fs.readFileSync(dataPath, "utf-8"));

    const maxId = items.length
        ? Math.max(...items.map((i: any) => i.id))
        : 0
    ;

    const newItem = {
        ...item,
        id: maxId + 1,
    };

    fs.writeFileSync(
        dataPath,
        JSON.stringify(newItem, null, 2)
    );

    return newItem;
}