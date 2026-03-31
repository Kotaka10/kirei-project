import express from "express"; //Expressを使ってサーバーを作る準備をしている(expressというライブラリを読み込んでいる)
import cors from "cors";
import path from "path";
import companyRoutes from "./routes/companyRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import itemRoutes from "./routes/itemRoutes.js";
import fileRoutes from "./routes/fileRoutes.js"

const app = express(); //サーバーを作っている
const PORT = 3000;

app.use(cors()); //フロントとバックエンドの連携
app.use(express.json()); //リクエストのJSONを読み取れるようにする（ここではapp.use("/api/companies, companyRoutes)などでPOSTなどを使うから必要")

app.use("/api/companies", companyRoutes);
app.use("/api/users", userRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/uploads", fileRoutes);
app.use("/uploads", express.static(path.resolve("uploads")));

app.listen(PORT, () => { //app.listen(PORT)　指定したポート番号でHTTPリクエストを受け付ける
    console.log(`server running on http://localhost:${PORT}`);
});

/*
  
*/