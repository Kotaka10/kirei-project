import express from "express";
import { addItem } from "../services/itemService.js";

export const router = express.Router();

router.post("/", addItem);
