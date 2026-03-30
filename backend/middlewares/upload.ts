import multer from "multer";
import path from "path";
import fs from "fs";

const uploadDir = "uploads";

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true }); // uploadsフォルダがあるかチェック　なければ作る
}

const storage = multer.diskStorage({ // ディスク（ローカル）に保存する設定
    destination: (_req, _file, cb) => { // uploadsフォルダに保存する _req → リクエスト（今回使ってない）_file → ファイル情報 cb → コールバック
        cb(null, uploadDir);  
    },
    filename: (_req, file, cb) => { // ファイル名の決め方
        const ext = path.extname(file.originalname); // 拡張子の取得（.jpg .png .pdf)
        const baseName = path.basename(file.originalname, ext); // ファイル名だけ取得（拡張子なし）
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`; // ユニークな値を作る　→ 同じ名前のファイルがアップされても上書きしないため
        cb(null, `${baseName}-${uniqueSuffix}${ext}`);
    },
});

const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => { // アップロードできるファイル制限
    const allowedTypes = [ // 下記三つの拡張子の許可
        "image/jpeg",
        "image/png",
        "application/pdf",
    ];

    if (allowedTypes.includes(file.mimetype)) { // OKならアップロード許可
        cb(null, true);
    } else {
        cb(new Error("許可されていないファイル形式です")); // NGならエラー
    }
};

export const uploader = multer({ // multer本体設定
    storage, // 保存方法（上記で定義したやつ）
    fileFilter, // ファイル形式チェック
    limits: { // 最大５MB
        fileSize: 5 * 1024 * 1024,
    },
});

/*
下記の全部やってる
フォルダ自動作成
ファイル保存場所指定
ファイル名の重複防止
ファイル形式制限（セキュリティ）
ファイルサイズ制限
*/