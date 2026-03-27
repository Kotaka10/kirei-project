import type { ItemInfoTypes } from "../../shared/types/ItemInfoTypes.js";
import mysql from "mysql2/promise";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";

const pool = mysql.createPool({
    host: "db",
    user: "root",
    password: process.env.DB_PASSWORD || "",
    database: "kirei_db",
    waitForConnections: true,
    connectionLimit: 10,
});

export const getItems = async () => {
    const [rows] = await pool.query<RowDataPacket[]>(`
        SELECT id, item_name, quantity, unit_price, description, unit
        FROM items
        ORDER BY id
    `);

    const items = rows.map((row: any) => ({
        id: row.id,
        itemName: row.item_name,
        description: row.description,
        quantity: row.quantity,
        unit: row.unit,
        unitPrice: row.unit_price
    }));

    return items;
}

export const addItem = async (item: ItemInfoTypes) => {
    const [result] = await pool.query<ResultSetHeader>(
        `
            INSERT INTO items (
                item_name,
                quantity,
                unit_price,
                description,
                unit
            ) VALUES (?, ?, ?, ?, ?)
        `,
        [
            item.itemName,
            item.quantity,
            item.unitPrice,
            item.description,
            item.unit
        ]
    );

    const newItem = {
        ...item,
        id: result.insertId,
    }

    return newItem;
}

export const searchItem = async (keyword: string) => {
    const [rows] = await pool.query<RowDataPacket[]>(
        `
            SELECT id, item_name, quantity, unit_price, description, unit
            FROM items
            WHERE item_name LIKE ?
        `,
        [`%${keyword}%`]
    );

    return rows.map((row) => ({
        id: row.id,
        itemName: row.item_name,
        quantity: row.quantity,
        unitPrice: row.unit_price,
        description: row.description,
        unit: row.unit,
    }));
}

export const updateItem = async (id: number, item: ItemInfoTypes) => {
    const [result] = await pool.query<ResultSetHeader>(
        `
            UPDATE items
            SET
                item_name = ?,
                quantity = ?,
                unit_price = ?,
                description = ?,
                unit = ?
            WHERE id = ? 
        `,
        [
            item.itemName,
            item.quantity,
            item.unitPrice,
            item.description,
            item.unit,
            id,
        ]
    );

    if (result.affectedRows === 0) {
        return null;
    }

    return { ...item, id };
}

export const deleteItem = async (id: number) => {
    const [result] = await pool.query<ResultSetHeader>(
        `
            DELETE FROM items
             WHERE id = ?
        `,
        [id]
    );

    if (result.affectedRows === 0) {
        return false;
    }

    return true;
}