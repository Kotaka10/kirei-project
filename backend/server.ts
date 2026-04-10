import express from "express"; //Expressを使ってサーバーを作る準備をしている(expressというライブラリを読み込んでいる)
import cors from "cors";
import path from "path";
import { createServer } from "http";
import companyRoutes from "./routes/companyRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import itemRoutes from "./routes/itemRoutes.js";
import fileRoutes from "./routes/fileRoutes.js";
import uploadRoutes from "./routes/uploadByBlobRoutes.js";
import { Server } from "socket.io";
import { createMessageRouter } from "./routes/messageRoutes.js";
import { registerChatSocket } from "./sockets/chatSocket.js";
import { messageService } from "./services/messageService.js";
import { createMessageController } from "./controllers/messageController.js";

const app = express(); //サーバーを作っている
const PORT = 3000;
const httpServer = createServer(app);

app.use(
    cors({
        origin: "http://localhost:5173",
        credentials: true,
    })
); //フロントとバックエンドの連携
app.use(express.json()); //リクエストのJSONを読み取れるようにする（ここではapp.use("/api/companies, companyRoutes)などでPOSTなどを使うから必要")

app.use("/api/companies", companyRoutes);
app.use("/api/users", userRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/uploads", fileRoutes);
app.use("/uploads", express.static(path.resolve("uploads")));
app.use("/upload-blob", uploadRoutes);

const controller = createMessageController(messageService);

app.use("/api/messages", createMessageRouter(controller));

const io = new Server(httpServer, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"],
    },
});

registerChatSocket(io);

httpServer.listen(PORT, () => { //httpServer.listen(PORT)　指定したポート番号でHTTPリクエストを受け付ける
    console.log(`server running on http://localhost:${PORT}`);
});
