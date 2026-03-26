import type { RowDataPacket } from "mysql2"

export type CompanyRow = RowDataPacket & {
    id: number,
    company_name: string,
    zipcode: string,
    prefecture: string,
    city: string,
    other_address: string,
    building_name: string,
    phone_number: string,
    contract_date: string,
    status: string,
}

export type CompanyDetailedRow = RowDataPacket & {
    id: number,
    company_name: string,
    zipcode: string,
    prefecture: string,
    city: string,
    other_address: string,
    building_name: string,
    phone_number: string,
    contract_date: string,
    status: string,
    email: string | null,
}