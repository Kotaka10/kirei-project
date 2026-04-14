import type { Request, Response } from "express";
import * as companyService from "../services/companyService.js";

export const getCompanies = async (req: Request, res: Response) => {
  try {
    const companies = await companyService.getAllCompanies();

    if (!companies) {
      return res.status(404).json({ message: "会社が見つかりませんでした" });
    }

    return res.status(200).json(companies);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "会社情報の取得に失敗しました" });
  }
};

export const getCompany = async (req: Request, res: Response) => {
  try {
    const company = await companyService.getCompanyById(Number(req.params.id));

    if (!company) {
      return res.status(404).json({ message: "会社が見つかりませんでした"});
    }

    return res.status(200).json(company);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "会社情報の取得に失敗しました"});
  }
};

export const updateCompany = async (req: Request, res: Response) => {
    try {
      const updatedCompany = await companyService.updateCompany(Number(req.params.id), req.body);

      if (!updatedCompany) {
        return res.status(404).json({ message: "会社が見つかりません" });
      }

      return res.json(updatedCompany);
    } catch (err) {
      console.error("updateCompanyのエラー", err);
      return res.status(500).json({ message: "会社情報の更新に失敗しました"});
    }
}

export const createCompany = async (req: Request, res: Response) => {
  try {
    const newData = req.body;
    const newCompany = await companyService.createCompany(newData);

    return res.status(201).json(newCompany);
  } catch(err) {
    console.error("createCompanyのエラー", err);
    return res.status(500).json({ message: "会社登録に失敗しました"});
  }
}