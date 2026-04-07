import type { ItemInfoTypes } from "../../../shared/types/ItemInfoTypes.js";
import * as itemRepository from "../../repositories/itemRepository.js";

export const addItem = async (item: ItemInfoTypes) => {
    const id = itemRepository.addItem(item);

    if (!id) {
        throw new Error("商品を追加できませんでした");
    }

    return {
        ...item,
        id,
    };
}

export const getItems = async () => {
    const [rows] = await itemRepository.getItems();

    if (!rows) {
        throw new Error("商品を取得できませんでした");
    }

    const items = rows.map((row) => ({
        id: row.id,
        itemName: row.item_name,
        description: row.description,
        quantity: row.quantity,
        unit: row.unit,
        unitPrice: row.unit_price
    }))

    return items;
}

export const searchItem = async (keyword: string) => {
    const [items] = await itemRepository.searchItem(keyword);

    if (!items) {
        throw new Error("商品を取得できませんでした");
    }

    const item = items.map((i) => ({
        id: i.id,
        itemName: i.item_name,
        description: i.description,
        quantity: i.quantity,
        unit: i.unit,
        unitPrice: i.unit_price,
    }))

    return item;
}

export const updateItem = async (id: number, item: ItemInfoTypes) => {
    const updatedItem = await itemRepository.updateItem(id, item);

    if (!updatedItem) {
        throw new Error("更新に失敗しました");
    }

    return updatedItem;
}

export const deleteItem = async (id: number) => {
    const [result] = await itemRepository.deleteItem(id);

    if (result.affectedRows === 0) {
        return false;
    }

    return true;
}