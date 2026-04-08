import type { ItemInfoTypes } from "../../shared/types/ItemInfoTypes.js";
import type { ItemRowTypes } from "../types/ItemRowTypes.js";
import * as itemRepository from "../repositories/itemRepository.js";

const formatItem = (item: ItemRowTypes) => ({
    id: item.id,
    itemName: item.item_name,
    quantity: item.quantity,
    unit: item.unit,
    unitPrice: item.unit_price,
    description: item.description
});

export const getItems = async () => {
    const [rows] = await itemRepository.getItems();

    return (rows as ItemRowTypes[]).map(formatItem);
}

export const addItem = async (item: ItemInfoTypes) => {
    const id = await itemRepository.addItem(item);

    if (!id) {
        throw new Error("正しいidを取得できませんでした");
    }

    return {
        ...item,
        id,
    };
}

export const searchItem = async (keyword: string) => {
    const [rows] = await itemRepository.searchItem(keyword);

    return (rows as ItemRowTypes[]).map(formatItem);
}

export const updateItem = async (id: number, item: ItemInfoTypes) => {
    const updated =  await itemRepository.updateItem(id, item);

    if (!updated) return null;

    return updated;
}

export const deleteItem = async (id: number) => {
    const [result] = await itemRepository.deleteItem(id);

    if (result.affectedRows === 0) {
        return false;
    }

    return true;
}