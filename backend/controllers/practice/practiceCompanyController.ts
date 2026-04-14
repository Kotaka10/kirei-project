import type { Request, Response } from "express";
import * as companyService from "../../services/companyService.js";

export const getAllCompanies = async (req: Request, res: Response ) => {
    try {
        const companies = await companyService.getAllCompanies();

        if (!companies) {
            return res.status(404).json({ message: "会社が見つかりませんでした" });
        }

        return res.status(200).json({ message: "会社情報の取得に成功しました" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "通信の問題が発生しました" });
    }
};

export const getCompanyById = async (req: Request, res: Response) => {
    try {
        const company = await companyService.getCompanyById(Number(req.params.id));

        if (!company) {
            return res.status(404).json({ message: "会社が見つかりませんでした" });
        }

        return res.status(200).json({ message: "会社情報の取得に成功しました" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "通信の問題が発生しました" });
    }
}