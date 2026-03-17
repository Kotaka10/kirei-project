import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import type { itemInfoTypes } from "../../shared/types/itemInfoTypes.js";
import items from "../data/items.json" with {type: "json"};

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataPath = path.join(__dirname, "../data/items.json");

export const getAllItems = () => {
    return JSON.parse(fs.readFileSync(dataPath, "utf-8"));
}

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

export const searchItem = (keyword: string) => {
    return items.filter((item) => 
        item.itemName.toLowerCase().includes(keyword.trim().toLowerCase())
    );
}

export const updateItem = (id: number, item: itemInfoTypes) => {
    const items = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
    const index = items.findIndex((i: {id: number}) => i.id === id);

    if (index === -1) {
        return null;
    }

    items[index] = {
        ...items[index],
        ...item
    }

    fs.writeFileSync(
        dataPath,
        JSON.stringify(items, null, 2)
    )

    return items[index];
}