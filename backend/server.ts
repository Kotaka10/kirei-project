import { Request, Response } from "express";

const companies = require("./data/companies.json")
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const app = express();

app.use(express.json());
app.use(cors());

type Params = { id: string};

app.get("/api/companies/:id", (req: Request<Params>, res: Response) => {
    const id = req.params.id;
    const company = companies.find((c: { id: string; }) => c.id == id);

    if (!company) {
        return res.status(404).json({ message: "ページが見つかりません" });
    }
    
    res.json(company);
});

app.get("/api/companies", (req: Request, res: Response) => {
    res.json(companies);
})

app.put("/api/companies/:id", (req: Request<Params>, res: Response) => {
    const id = Number(req.params.id);
    const updatedData = req.body;

    const index = companies.findIndex((c: { id: any; }) => Number(c.id) === id);

    if (index === -1) {
        return res.status(404).json({ message: "会社が見つかりません" });
    }

    companies[index] = { ...companies[index], ...updatedData };

    fs.writeFileSync(
        "./companies.json",
        JSON.stringify(companies, null, 2)
    );

    res.json(companies[index]);
});

app.listen(3000);