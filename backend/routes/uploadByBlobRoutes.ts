import express from "express";
import { uploadConfig } from "../middlewares/uploadFile.js";
// import { uploadFile } from "../controllers/uploadByBlobController.js";
import * as uploadByBlobController from "../controllers/uploadByBlobController.js";

const router = express.Router();

// router.post("/", uploadConfig.single("file"), uploadFile);
router.post("/", uploadConfig.single("file"), uploadByBlobController.upload);
router.get("/:id", uploadByBlobController.display);

export default router;