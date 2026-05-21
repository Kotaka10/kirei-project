import type { RowDataPacket } from "mysql2/promise";
import { getConnection } from "../db/connection.js";

export interface StaffRecord {
  id:            number;
  name:          string;
  role:          "cleaner" | "technician" | "supervisor";
  email:         string;
  password_hash: string;
  is_active:     boolean;
}

export class StaffRepository {
  async findByEmail(email: string): Promise<StaffRecord | null> {
    const conn = await getConnection();
    try {
        const [rows] = await conn.query<RowDataPacket[]>(
            `SELECT id, name, role, email, password_hash, is_active
            FROM staffs
            WHERE email = ? AND is_active = true
            LIMIT 1`,
            [email]
        );
        return (rows[0] as StaffRecord) ?? null;
    } finally {
        await conn.end();
    }
  }

  async findById(id: number): Promise<StaffRecord | null> {
    const conn = await getConnection();
    try {
        const [rows] = await conn.query<RowDataPacket[]>(
            `SELECT id, name, role, email, is_active
            FROM staffs
            WHERE id = ? AND is_active = true
            LIMIT 1`,
            [id]
        );
        return (rows[0] as StaffRecord) ?? null;
    } finally {
        await conn.end();
    }
  }

  async updateLastLogin(id: number): Promise<void> {
    const conn = await getConnection();
    try {
        await conn.query(
            "UPDATE staffs SET last_login_at = NOW() WHERE id = ?",
            [id]
        );
    } finally {
        await conn.end();
    }
  }
}