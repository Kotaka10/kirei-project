import express from "express";
import cors from "cors";
import companyRoutes from "./routes/companyRoutes.js";
import userRoutes from "./routes/userRoutes.js"

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/companies", companyRoutes);
app.use("/api/users", userRoutes);

app.listen(3000, () => {
    console.log("server running on port 3000");
});