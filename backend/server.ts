import express from "express";
import cors from "cors";
import companyRoutes from "./routes/companyRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import itemRoutes from "./routes/itemRoutes.js";

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.use("/api/companies", companyRoutes);
app.use("/api/users", userRoutes);
app.use("/api/items", itemRoutes);

app.listen(PORT, () => {
    console.log(`server running on http://localhost:${PORT}`);
});