import { upload, getAllFiles } from "../controllers/fileController.js";
import { uploader } from "../middlewares/uploadFile.js";
import express from "express";

const router = express.Router();

// fileという名前のファイルを処理する前処理 .single('file')が必要なのはexpress単体ではファイルを扱えないため
router.post('/', uploader.single('file'), upload); //ミドルウェアを二つ指定している
router.get('/', getAllFiles);

export default router;