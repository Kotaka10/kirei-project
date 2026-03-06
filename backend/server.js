const users = require("./data/companies.json")
const express = require("express");
const cors = require("cors");
const fs = require("fs");

const app = express();

let companies = [];

app.use(express.json());
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

app.put("/api/companies/:id", (req, res) => {
    const id = Number(req.params.id);
    const updatedData = req.body;

    const index = companies.findIndex((c) => c.id === id);
    if (index === -1) {
        return res.status(404).json({ message: "会社が見つかりません" });
    }

    companies[index] = { ...companies[index], ...updatedData };

    res.json(companies[index]);
});

app.listen(3000);