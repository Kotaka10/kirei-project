import type { Request, Response } from "express";
import * as itemService from "../services/itemService.js";

export const addItem = (req: Request, res: Response) => {
    const item = req.body;
    const newItem = itemService.addItem(item);

    res.json(newItem);
}

export const getItems = async (req: Request, res: Response) => {
    try {
        const items = await itemService.getItems();
        res.json(items);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "商品の取得に失敗しました。"});
    }
}

export const searchItem = async (req: Request, res: Response) => {
    const name = req.query.name as string;

    if (!name) {
        return res.status(400).json({ message: "名前の情報が必要です。"});
    }

    const items = await itemService.searchItem(name);
    return res.json(items);
}

export const updateItem = (req: Request, res: Response) => {
    const id = req.params.id;

    const updatedItem = itemService.updateItem(Number(id), req.body);

    if (!updatedItem) {
        return res.status(404).json({ message: "商品が見つかりません"});
    }

    res.json(updatedItem);
}

export const deleteItem = (req: Request, res: Response) => {
    const id = req.params.id;

    if (!id) {
        return res.status(400).json({ message: "IDが必要です"});
    }

    const result = itemService.deleteItem(Number(id));
    
    if (!result) {
        return res.status(404).json({ message: "商品が見つかりまん"})
    }

    return res.json({ message: "削除しました", result });
}