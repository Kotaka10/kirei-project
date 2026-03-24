import type { ContractStatus } from "./ContractStatusTypes.js";

export type CompanyInfoTypes = {
    id: number;
    companyName: string;
    zipcode: string;
    prefecture: string;
    city: string;
    otherAddress: string;
    buildingName: string;
    phoneNumber: string;
    emails: string[];
    contractDate: string;
    status: ContractStatus;
    cancellationDate: string;
}