import type { CompanyInfoTypes } from "../../../shared/types/CompanyInfoTypes.js";
import * as companyRepository from "../../repositories/companyRepository.js";

const normalizeDate = (value: string | null) => {
    if (!value) {
        return null;
    }

    return value.slice(0, 10);
}

export const getAllCompanies = async () => {
    return await companyRepository.getAllCompanies();
};

export const getCompanyById = async (id: number) => {
    return await companyRepository.getCompanyById(id);
}

export const updateCompany = async (id: number, company: CompanyInfoTypes) => {
    const formatCompany = {
        ...company,
        contractDate: normalizeDate(company.contractDate),
    }

    return await companyRepository.updateCompany(id, formatCompany);
};

export const createCompany = async (company: CompanyInfoTypes) => {
    const formatCompany = {
        ...company,
        contractDate: normalizeDate(company.contractDate),
    };

    const id = await companyRepository.createCompany(formatCompany);

    return { ...formatCompany, id };
}