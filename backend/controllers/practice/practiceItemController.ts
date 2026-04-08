import type { Request, Response } from "express";
import * as itemService from "../../services/itemService.js";

export const addItem = async (req: Request, res: Response) => {
    try {
        const item = req.body;
        const newItem = await itemService.addItem(item);

        if (!newItem) {
            return res.status(400).json({ message: "商品を登録できませんでした" });
        }

        return res.status(201).json(newItem);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "商品の登録に失敗しました" });
    }
}

export const getItems = async (req: Request, res: Response) => {
    try {
        const items = await itemService.getItems();

        return res.status(200).json(items);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "商品の取得に失敗しました" });
    }
}

export const searchItem = async (req: Request, res: Response) => {
    try {
        const name = req.query.name;

        if (!name) {
            return res.status(400).json({ message: "商品名が必要です" });
        }

        const items = await itemService.searchItem(name as string);

        if (!items) {
            return res.status(404).json({ message: "商品が見つかりません" });
        }

        return res.status(200).json(items);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "商品の取得に失敗しました" });
    }
}

export const updateItem = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        const item = req.body;

        if (Number.isNaN(id)) {
            return res.status(400).json({ message: "正しいidが必要です" });
        }

        const updatedItem = await itemService.updateItem(id, item);

        if (!updatedItem) {
            return res.status(404).json({ message: "商品が見つかりません" });
        }

        return res.status(200).json(updatedItem);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "商品の更新に失敗しました" });
    }
}

export const deleteItem = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);

        if (Number.isNaN(id)) {
            return res.status(400).json({ message: "正しいidが必要です" });
        }

        const deleted = await itemService.deleteItem(id);
        
        return res.status(200).json({ message: "商品の削除に成功しました", deleted});
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "商品の削除に失敗しました" });
    }
}