const express = require("express");
const cors = require("cors");
const app = express();

const useRoutes = require("./controllers/companyCommunication.ts");

app.use(cors());
app.use(express.json());

app.use("/api/companies", useRoutes);

app.listen(3000, () => {
    console.log("server running on port 3000");
});