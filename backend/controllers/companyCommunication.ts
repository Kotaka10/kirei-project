import type { Request, Response } from "express";

const express = require("express");
const fs = require("fs");
const router = express.Router();
const path = require("path");

const companies = require(path.join(__dirname, "../data/companies.json"));

type Params = { id: string};

router.get("/:id", (req: Request<Params>, res: Response) => {
    const id = req.params.id;
    const company = companies.find((c: { id: string; }) => c.id == id);

    if (!company) {
        return res.status(404).json({ message: "ページが見つかりません" });
    }
    
    res.json(company);
});

router.get("/", (req: Request, res: Response) => {
    res.json(companies);
})

router.put("/id", (req: Request<Params>, res: Response) => {
    const id = Number(req.params.id);
    const updatedData = req.body;

    const index = companies.findIndex((c: { id: any; }) => Number(c.id) === id);

    if (index === -1) {
        return res.status(404).json({ message: "会社が見つかりません" });
    }

    companies[index] = { ...companies[index], ...updatedData };

    fs.writeFileSync(
        "../data/companies.json",
        JSON.stringify(companies, null, 2)
    );

    res.json(companies[index]);
});

router.post("/", (req: Request, res: Response) => {
    const newCompany = req.body;

    companies.push(newCompany);

    fs.writeFileSync(
        path.join(__dirname, "../data/companies.json"),
        JSON.stringify(companies, null, 2)
    );

    res.json(newCompany);
});

module.exports = router;