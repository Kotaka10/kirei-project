import { upload, getAllFiles } from "../controllers/fileController.js";
import { uploader } from "../middlewares/uploadFile.js";
import express from "express";

const router = express.Router();

router.post('/', uploader.single('file'), upload);
router.get('/', getAllFiles);

export default router;