import type { Request, Response } from "express";
import * as itemServicee from "../services/itemService.js";

export const addItem = (req: Request, res: Response) => {
    const item = req.body;
    const newItem = itemServicee.addItem(item);

    res.json(newItem);
}