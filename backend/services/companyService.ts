import type { CompanyInfoTypes } from "../../shared/types/CompanyInfoTypes.js";
import * as companyRepository from "../repositories/companyRepository.js";

const normalizeDate = (value?: string | null) => {
  if (!value) return null;
  return value.slice(0, 10);
}

export const getAllCompanies = async () => {
  return companyRepository.getAllCompanies();
};

export const getCompanyById = async (id: number) => {
  return companyRepository.getCompanyById(id);
};

export const updateCompany = async (id: number, company: CompanyInfoTypes) => {
  const formattedCompany = {
    ...company,
    contractDate: normalizeDate(company.contractDate),
  }

  return await companyRepository.updateCompany(id, formattedCompany);
};

export const createCompany = async (company: CompanyInfoTypes) => {
  const formattedCompany = {
    ...company,
    contractDate: normalizeDate(company.contractDate),
  }

  const id = await companyRepository.createCompany(formattedCompany);

  return {
    ...formattedCompany,
    id,
  };
};