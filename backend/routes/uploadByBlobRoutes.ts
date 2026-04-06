import express from "express";
import { uploadConfig } from "../middlewares/uploadFile.js";
import { uploadFile } from "../controllers/uploadByBlobController.js";

const router = express.Router();

router.post("/", uploadConfig.single("file"), uploadFile);

export default router;