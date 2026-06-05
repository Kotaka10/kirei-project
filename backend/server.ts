import dotenv from "dotenv";
import express from "express"; //Expressを使ってサーバーを作る準備をしている(expressというライブラリを読み込んでいる)
import cors from "cors";
import path from "path";
import companyRoutes from "./routes/companyRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import itemRoutes from "./routes/itemRoutes.js";
import fileRoutes from "./routes/fileRoutes.js";
import uploadRoutes from "./routes/uploadByBlobRoutes.js";
import { createServer } from "http";
import { Server } from "socket.io";
import { createMessageRouter } from "./routes/messageRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import chatHistoryRoutes from "./routes/chatHistoryRoutes.js";
import authRoutes from "./routes/auth.router.js";
import documentRoutes from "./routes/documentRoutes.js";
import skillRoutes from "./routes/skillRoutes.js";
import jobRoutes from "./routes/jobRoutes.js";
import assignmentRoutes from "./routes/assignmentRoutes.js";
import caseRoutes from "./routes/caseRoutes.js";
import { registerChatSocket } from "./sockets/chatSocket.js";
import { messageService } from "./services/messageService.js";
import { createMessageController } from "./controllers/messageController.js";

dotenv.config(); // ローカル開発用: .envから環境変数を読み込む（Docker環境ではcompose.yamlが注入）

const app = express(); //サーバーを作っている
const PORT = 3000;
const httpServer = createServer(app); //Express + Socket.IOを同じサーバーで動かすための土台 → Socket.ioを使う → HTTPサーバーに直接くっつく(const io = new Server(httpServer, {}})に関わってくる

app.use( //フロントとバックエンドの連携
    cors({
        origin: [
            "http://localhost:5173",
            "https://waviness-unsightly-freely.ngrok-free.dev",
        ],
        credentials: true,
    })
);
app.use(express.json()); //リクエストのJSONを読み取れるようにする（ここではapp.use("/api/companies, companyRoutes)などでPOSTなどを使うから必要")

app.use("/api/companies", companyRoutes);
app.use("/api/users", userRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/uploads", fileRoutes);
app.use("/uploads", express.static(path.resolve("uploads")));
app.use("/upload-blob", uploadRoutes);

const controller = createMessageController(messageService);

app.use("/api/messages", createMessageRouter(controller));

app.use("/api/chat", chatRoutes);
app.use("/api/chat/sessions", chatHistoryRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/skills",      skillRoutes);
app.use("/api/jobs",        jobRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/documents",  documentRoutes);
app.use("/api/cases",      caseRoutes);

const io = new Server(httpServer, { //Socket.IOサーバーを作っている
    cors: {
        origin: [
            "http://localhost:5173",
            "https://waviness-unsightly-freely.ngrok-free.dev",
        ],
        methods: ["GET", "POST"],
        credentials: true,
    },
});

registerChatSocket(io); //このサーバーでどう通信するかを設定している

httpServer.listen(PORT, () => {
    console.log(`server running on http://localhost:${PORT}`);
});
