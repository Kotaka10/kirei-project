import type { ContractStatus } from "./contractStatus";

export type CompanyInfoTypes = {
    id: number;
    companyName: string;
    zipcode: string;
    prefecture: string;
    shikutyouson: string;
    streetAddress: string;
    buildingName: string;
    phoneNumber: string;
    email: string[];
    contractDate: string;
    status: ContractStatus | null;
    cancellationDate: string;
}