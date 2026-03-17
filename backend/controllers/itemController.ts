import type { Request, Response } from "express";
import * as itemService from "../services/itemService.js";

export const addItem = (req: Request, res: Response) => {
    const item = req.body;
    const newItem = itemService.addItem(item);

    res.json(newItem);
}

export const getItems = (req: Request, res: Response) => {
    return res.json(itemService.getAllItems());
}

export const searchItem = (req: Request, res: Response) => {
    const name = req.query.name as string;

    if (!name) {
        return res.status(400).json({ message: "名前の情報が必要です。"});
    }

    const items = itemService.searchItem(name);
    return res.json(items);
}