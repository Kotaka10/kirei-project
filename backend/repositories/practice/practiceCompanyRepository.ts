import type { ResultSetHeader } from "mysql2";
import type { CompanyInfoTypes } from "../../../shared/types/CompanyInfoTypes.js";
import pool from "../../config/db.js"
import type { CompanyDetailedRow, CompanyRow } from "../../types/CompanyRowTypes.js"

export const getAllCompanies = async () => {
    const [rows] = await pool.execute<CompanyRow[]>(
        `
        SELECT
            id,
            company_name,
            zipcode,
            prefecture,
            city,
            other_address,
            building_name,
            phone_number,
            contract_date,
            status
        FROM companies
        ORDER BY id
        `
    );

    return rows.map((row) => ({
        id: row.id,
        companyName: row.company_name,
        zipcode: row.zipcode,
        prefecture: row.prefecture,
        city: row.city,
        otherAddress: row.other_address,
        buildingName: row.building_name,
        phoneNumber: row.phone_number,
        contractDate: row.contract_date,
        status: row.status,
    }));
}

export const getCompanyById = async (id: number) => {
    const [rows] = await pool.execute<CompanyDetailedRow[]>(
        `
        SELECT
            id,
            company_name,
            zipcode,
            prefecture,
            city,
            other_address,
            building_name,
            phone_number,
            contract_date,
            status,
            cancellationDate,
            emails
        FROM companies AS c
        LEFTJOIN company_emails AS ce
        ON c.id = ce.company_id
        `,
        [id]
    );

    const map = new Map<number, CompanyInfoTypes>();

    rows.forEach((row) => {
        if (!map.has(row.id)) {
            map.set(row.id, {
                id: row.id,
                companyName: row.company_name,
                zipcode: row.zipcode,
                prefecture: row.prefecture,
                city: row.city,
                otherAddress: row.other_address,
                buildingName: row.building_name,
                phoneNumber: row.phone_number,
                contractDate: row.contract_date,
                status: row.status,
                cancellationDate: "",
                emails: []
            })
        }

        if (row.email) {
            map.get(row.id)?.emails.push(row.email);
        }
    })

    return map.values().next().value ?? null;
}

export const updateCompany = async (id: number, company: CompanyInfoTypes) => {
    const [result] = await pool.execute<ResultSetHeader>(
        `
        UPDATE companies
           SET
            company_name = ?,
            zipcode = ?,
            prefecture = ?,
            city = ?,
            other_address = ?,
            building_name = ?,
            phone_number = ?,
            contract_date = ?,
            status = ?
         WHERE id = ?
        `,
        [
            company.companyName,
            company.zipcode,
            company.prefecture,
            company.city,
            company.otherAddress,
            company.buildingName,
            company.phoneNumber,
            company.contractDate,
            company.status,
            id
        ]
    );

    if (result.affectedRows === 0) {
        return null;
    }

    return { ...company, id };
}

export const createCompany = async (company: CompanyInfoTypes) => {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const [result] = await connection.execute<ResultSetHeader>(
            `
            INSERT INTO companies (
                company_name,
                zipcode,
                prefecture,
                city,
                other_address,
                building_name,
                phone_number,
                contract_date,
                status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
                company.companyName,
                company.zipcode,
                company.prefecture,
                company.city,
                company.otherAddress,
                company.buildingName,
                company.phoneNumber,
                company.contractDate,
                company.status
            ]
        );

        const companyId = result.insertId;

        if (company.emails && company.emails.length > 0) {
            const emailValues = company.emails.map((email) => [
                companyId,
                email
            ]);

            await connection.execute(
                `
                INSERT INTO company_emails (company_id, email)
                VALUES ?
                `,
                [emailValues]
            );
        }

        await connection.commit();

        return companyId;
    } catch (err) {
        await connection.rollback();
        throw err;
    } finally {
        connection.release();
    }


}