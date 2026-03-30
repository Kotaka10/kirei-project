import { upload } from "../controllers/fileController.js";
import { uploader } from "../middlewares/upload.js";
import express from "express";

const router = express.Router();

router.post('/upload', uploader.single('file'), upload);

export default router;