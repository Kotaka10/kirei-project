import type { CompanyInfoTypes } from "../../../shared/types/CompanyInfoTypes.js";
import * as companyRepository from "../../repositories/companyRepository.js";

const normalizeDate = (date:string | null) => {
    if (!date) return null;
    return date?.slice(0, 10);
}

export const getCompany = async () => {
    return await companyRepository.getAllCompanies();
}

export const getCompanyById = async (id: number) => {
    return companyRepository.getCompanyById(id);
}

export const updateCompany = async (id: number, company: CompanyInfoTypes) => {
    const formattedCompany = {
        ...company,
        contractDate: normalizeDate(company.contractDate),
    }

    return await companyRepository.updateCompany(id, formattedCompany);
}

export const createCompany = async (newCompany: CompanyInfoTypes) => {
    const formattedCompany = {
        ...newCompany,
        contractDate: normalizeDate(newCompany.contractDate),
    }

    const id = await companyRepository.createCompany(formattedCompany);

    return {
        ...formattedCompany,
        id: id,
    }
}