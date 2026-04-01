import type { Request, Response } from "express";
import * as itemService from "../services/itemService.js";

export const addItem = async (req: Request, res: Response) => {
    try {
        const item = req.body;
        const newItem = await itemService.addItem(item);

        res.json(newItem);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "商品の登録に失敗しました"});
    }
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
    try {
        const name = req.query.name as string;

        if (!name) {
            return res.status(400).json({ message: "名前の情報が必要です。"});
        }

        const items = await itemService.searchItem(name);
        return res.json(items);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "商品の取得に失敗しました"});
    }
}

export const updateItem = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;

        const updatedItem = await itemService.updateItem(Number(id), req.body);

        if (!updatedItem) {
            return res.status(404).json({ message: "商品が見つかりません"});
        }

        res.json(updatedItem);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "商品情報の更新に失敗しました"});
    }
}

export const deleteItem = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;

        if (!id) {
            return res.status(400).json({ message: "IDが必要です"});
        }

        const result = await itemService.deleteItem(Number(id));
        
        if (!result) {
            return res.status(404).json({ message: "商品が見つかりまん"})
        }

        return res.json({ message: "削除しました", result });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "商品の削除に失敗しました"});
    }
}