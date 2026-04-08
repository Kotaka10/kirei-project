import type { ItemInfoTypes } from "../../../shared/types/ItemInfoTypes.js";
import * as itemRepository from "../../repositories/itemRepository.js";

export const addItem = async (item: ItemInfoTypes) => {
    const id = await itemRepository.addItem(item);

    if (!id) {
        throw new Error("正しいidを取得できませんでした");
    }

    return { ...item, id };
}

export const getItems = async () => {
    const [items] = await itemRepository.getItems();

    const result = items.map((item) => ({
        id: item.id,
        itemName: item.item_name,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unit_price,
        description: item.description
    }))

    return result;
}

export const searchItem = async (keyword: string) => {
    const [items] = await itemRepository.searchItem(keyword);

    const result = items.map((item) => ({
        id: item.id,
        itemName: item.item_name,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unit_price,
        description: item.description
    }))

    return result;
}

export const updateItem = async (id: number, item: ItemInfoTypes) => {
    const updated = await itemRepository.updateItem(id, item);

    if (!updated) {
        return null;
    }

    return updated;
}

export const deleteItem = async (id: number) => {
    const deleted = await itemRepository.deleteItem(id);

    if (!deleted) {
        return null;
    }

    return deleted;
}