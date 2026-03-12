import express from "express";
import cors from "cors";
import companyRoutes from "./routes/companyRoutes.js"

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/companies", companyRoutes);

app.listen(3000, () => {
    console.log("server running on port 3000");
});