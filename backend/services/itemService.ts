import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import type { itemInfoTypes } from "../../shared/types/itemInfoTypes.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataPath = path.join(__dirname, "../data/items.json");

export const addItem = (item: itemInfoTypes) => {
    const items = JSON.parse(fs.readFileSync(dataPath, "utf-8"));

    const maxId = items.length
        ? Math.max(...items.map((i: itemInfoTypes) => i.id))
        : 0
    ;

    const newItem = {
        ...item,
        id: maxId + 1,
    };

    items.push(newItem);

    fs.writeFileSync(
        dataPath,
        JSON.stringify(items, null, 2)
    );

    return newItem;
}