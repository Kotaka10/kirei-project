import { Router, type Request, type Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import type { RowDataPacket } from "mysql2";
import { LoginRequestSchema } from "../types/auth.js";
import { getConnection } from "../db/connection.js";

const router = Router();
const JWT_SECRET  = process.env.JWT_SECRET ?? "change-this-secret";
const JWT_EXPIRES = process.env.JWT_EXPIRES ?? "8h";

router.post("/login", async (req: Request, res: Response) => {
    const parsed = LoginRequestSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({
            error: parsed.error.issues[0]?.message ?? "入力が不正です",
        });
    }

    const { email, password } = parsed.data;
    const conn = await getConnection();
})