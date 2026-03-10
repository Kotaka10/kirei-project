const express = require("express");
const cors = require("cors");
const app = express();
const useRoutes = require("./../server.ts");

app.use("/companies", useRoutes);
app.use(express.json());
app.use(cors());

app.listen(3000);