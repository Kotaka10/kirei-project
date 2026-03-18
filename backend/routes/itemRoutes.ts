import express from "express";
import { addItem, getItems } from "../controllers/itemController.js";
import { searchItem, updateItem, deleteItem } from "../controllers/itemController.js";

const router = express.Router();

router.post("/", addItem);
router.get("/", getItems);
router.get("/search", searchItem);
router.put("/item-edit/:id", updateItem);
router.delete("/delete/:id", deleteItem);

export default router;