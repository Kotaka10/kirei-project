import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataPath = path.join(__dirname, "../data/companies.json");

export const getAllCompanies = () => {
  return JSON.parse(fs.readFileSync(dataPath, "utf8"));
};

export const getCompanyById = (id: number) => {
  const companies = JSON.parse(fs.readFileSync(dataPath, "utf-8"));

  const company = companies.find((c: { id: number }) => c.id === id);

  return company;
};

export const updateCompany = (id: number, company: any) => {
  const companies = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
  const index = companies.findIndex((c: { id: number }) => c.id === id);

  if (index === -1) {
    return null;
  }

  companies[index] = {
    ...companies[index],
    ...company
  };

  fs.writeFileSync(
    dataPath,
    JSON.stringify(companies, null, 2)
  )

  return companies[index];
};

export const createCompany = (newCompany: any) => {
  const companies = JSON.parse(fs.readFileSync(dataPath, "utf-8"));

  const maxId = companies.length
    ? Math.max(...companies.map((c: any) => c.id))
    : 0;

  const company = {
    ...newCompany,
    id: maxId + 1,
  };

  companies.push(company);

  fs.writeFileSync(
    dataPath,
    JSON.stringify(companies, null, 2)
  );

  return company;
}