import type { ItemInfoTypes } from "../../shared/types/ItemInfoTypes.js";
import * as itemRepository from "../repositories/itemRepository.js";

export const getItems = async () => {
    const [rows] = await itemRepository.getItems();

    const items = rows.map((row: any) => ({
        id: row.id,
        itemName: row.item_name,
        description: row.description,
        quantity: row.quantity,
        unit: row.unit,
        unitPrice: row.unit_price
    }));

    return items;
}

export const addItem = async (item: ItemInfoTypes) => {
    const id = await itemRepository.addItem(item);

    return {
        ...item,
        id,
    };
}

export const searchItem = async (keyword: string) => {
    const [rows] = await itemRepository.searchItem(keyword);

    return rows.map((row) => ({
        id: row.id,
        itemName: row.item_name,
        quantity: row.quantity,
        unitPrice: row.unit_price,
        description: row.description,
        unit: row.unit,
    }));
}

export const updateItem = async (id: number, item: ItemInfoTypes) => {
    return await itemRepository.updateItem(id, item);
}

export const deleteItem = async (id: number) => {
    const [result] = await itemRepository.deleteItem(id);

    if (result.affectedRows === 0) {
        return false;
    }

    return true;
}