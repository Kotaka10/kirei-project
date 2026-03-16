import express from "express";
import { addItem } from "../controllers/itemController.js";

const router = express.Router();

router.post("/", addItem);

export default router;