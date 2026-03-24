import mysql from "mysql2/promise";
import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import type { CompanyInfoTypes } from "../../shared/types/CompanyInfoTypes.js";

const pool = mysql.createPool({
    host: "localhost",
    user: "user",
    password: "password",
    database: "kirei_db",
    waitForConnections: true,
    connectionLimit: 10,
});

const normalizeDate = (value?: string | null) => {
  if (!value) return null;
  return value.slice(0, 10);
}

export const getAllCompanies = async () => {
  const [rows] = await pool.query<RowDataPacket[]>(
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

  const companies = rows.map((row: any) => ({
    id: row.id,
    companyName: row.company_name,
    zipcode: row.zipcode,
    prefecture: row.prefecture,
    city: row.city,
    otherAddress: row.other_address,
    buildingName: row.building_name,
    phoneNumber: row.phone_number,
    contractDate: row.contract_date,
    status: row.status
  }));

  return companies;
};

export const getCompanyById = async (id: number) => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `
      SELECT 
        c.id,
        c.company_name,
        c.zipcode,
        c.prefecture,
        c.city,
        c.other_address,
        c.building_name,
        c.phone_number,
        c.contract_date,
        c.status,
        ce.email
      FROM companies AS c
      LEFT JOIN company_emails AS ce
      ON c.id = ce.company_id
      WHERE c.id = ?
    `,
    [id]
  );

  const companyMap = new Map<number, any>();

  rows.forEach((row) => {
    if (!companyMap.has(row.id)) {
      companyMap.set(row.id, {
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
        emails: [],
      });
    }

    if (row.email) {
      companyMap.get(row.id).emails.push(row.email);
    }
  })

  return companyMap.values().next().value ?? null;
};

export const updateCompany = async (id: number, company: CompanyInfoTypes) => {
  const [result] = await pool.query<ResultSetHeader>(
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
      normalizeDate(company.contractDate),
      company.status,
      id
    ]
  );

  if (result.affectedRows === 0) {
    return null;
  }

  return {...company, id};
};

export const createCompany = async (company: CompanyInfoTypes) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [result] = await connection.query<ResultSetHeader>(
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
        normalizeDate(company.contractDate),
        company.status,
      ]
    );

    const companyId = result.insertId;

    if (company.emails && company.emails.length > 0) {
      const emailValues = company.emails.map((email) => [
        companyId,
        email
      ]);
    
      await connection.query(
        `
        INSERT INTO company_emails (company_id, email)
        VALUES ?
        `,
        [emailValues]
      );
    }

    await connection.commit();

    const newCompany = {
      ...company,
      id: result.insertId
    };

    return newCompany;
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};