import type { Request, Response } from "express";
import * as companyService from "../services/companyService.js";

export const getCompanies = async (req: Request, res: Response) => {
  res.json(await companyService.getAllCompanies());
};

export const getCompany = async (req: Request, res: Response) => {
  const company = await companyService.getCompanyById(Number(req.params.id));

  if (!company) {
    return res.status(404).json({ message: "会社が見つかりません" });
  }

  res.json(company);
};

export const updateCompany = async (req: Request, res: Response) => {
    const updatedCompany = await companyService.updateCompany(Number(req.params.id), req.body);

    if (!updatedCompany) {
      return res.status(404).json({ message: "会社が見つかりません" });
    }

    res.json(updatedCompany);
}

export const createCompany = async (req: Request, res: Response) => {
  const newData = req.body;
  const newCompany = await companyService.createCompany(newData);

  if (!newCompany) {
    return res.status(404).json({ message: "新しい会社が見つかりませんでした"})
  }

  res.json(newCompany);
}