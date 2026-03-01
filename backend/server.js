const users = require("./data/companies.json")
const express = require("express");
const cors = require("cors");
const fs = require("fs");

const app = express();

app.use(cors());

app.get("/api/companies/:id", (req, res) => {
    const id = Number(req.params.id);
    const user = users.find((u) => u.id == id);

    if (!user) {
        return res.status(404).json({ message: "ページが見つかりません" });
    }
    
    res.json(user);
});

app.get("/api/companies", (req, res) => {
    const data = JSON.parse(
        fs.readFileSync("./data/companies.json", "utf-8")
    );
    res.json(data);
})

app.listen(3000);