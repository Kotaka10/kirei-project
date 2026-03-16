import type { Request, Response } from "express";
import * as itemService from "../services/itemService.js";

export const addItem = (req: Request, res: Response) => {
    const item = req.body;
    const newItem = itemService.addItem(item);

    res.json(newItem);
}

export const getItems = (req: Request, res: Response) => {
    res.json(itemService.getAllItems());
}