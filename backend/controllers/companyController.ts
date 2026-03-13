import type { Request, Response } from "express";
import * as companyService from "../services/companyService.js";

export const getCompanies = (req: Request, res: Response) => {
  res.json(companyService.getAllCompanies());
};

export const getCompany = (req: Request, res: Response) => {
  const company = companyService.getCompanyById(Number(req.params.id));

  if (!company) {
    return res.status(404).json({ message: "会社が見つかりません" });
  }

  res.json(company);
};

export const updateCompany = (req: Request, res: Response) => {
    const updatedCompany = companyService.updateCompany(Number(req.params.id), req.body);

    if (!updatedCompany) {
      return res.status(404).json({ message: "会社が見つかりません" });
    }

    res.json(updatedCompany);
}

export const createCompany = (req: Request, res: Response) => {
  const newData = req.body;
  const newCompany = companyService.createCompany(newData);

  res.json(newCompany);
}