import type { Request, Response } from "express";
import * as userService from "../services/userService.js";

export const createUser = (req: Request, res: Response) => {
    const newData = req.body;
    const newUser = userService.createUser(newData);

    res.json(newUser);
}