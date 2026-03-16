import express from "express";
import { addItem, getItems } from "../controllers/itemController.js";
import { searchItem } from "../controllers/itemController.js";

const router = express.Router();

router.post("/", addItem);
router.get("/", getItems);
router.get("/search", searchItem);

export default router;