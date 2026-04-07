import type { Request, Response } from "express";
import * as itemService from "../../services/itemService.js";

export const addItem = async (req: Request, res: Response) => {
    try {
        const newItem = req.body;
        const addedItem = await itemService.addItem(newItem);

        res.json(addedItem);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "商品の登録に失敗しました" });
    }
}

export const getItems = async (req: Request, res: Response) => {
    try {
        const items = await itemService.getItems();
        res.status(200).json(items);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "商品に取得に失敗しました"});
    }
}

export const searchItem = async (req: Request, res: Response) => {
    try {
        const name = req.query.name as string;

        if (!name) {
            res.status(400).json({ message: "名前の情報が必要です"});
        }

        const items = await itemService.searchItem(name);
        res.json(items);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "商品の検索に失敗しました"});
    }
}

export const updateItem = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        const item = req.body;
        const updatedItem = await itemService.updateItem(Number(id),item);

        if (!updateItem) {
            res.status(404).json({ message: "商品が見つかりませn" });
        }

        res.json({ message: "更新しました", updatedItem });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "更新に失敗しました"});
    }
}

export const deleteItem = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;

        if (!id) {
            res.status(400).json({ message: "idが必要です" });
        }

        const result = await itemService.deleteItem(Number(id));

        if (!result) {
            res.status(404).json({ message: "商品が見つかりません" });
        }

        res.json({ message: "削除しました ", result });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "商品の削除に失敗しました" });
    }
}