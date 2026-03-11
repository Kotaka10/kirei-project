import type { ContractStatus } from "./contractStatusTypes";

export type CompanyInfoTypes = {
    id: number;
    companyName: string;
    zipcode: string;
    prefecture: string;
    city: string;
    otherAddress: string;
    buildingName: string;
    phoneNumber: string;
    email: string[];
    contractDate: string;
    status: ContractStatus;
    cancellationDate: string;
}