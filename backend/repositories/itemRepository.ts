import type { ResultSetHeader, RowDataPacket } from "mysql2";
import pool from "../config/db.js";
import type { ItemInfoTypes } from "../../shared/types/ItemInfoTypes.js";


export const getItems = async () => {
    return await pool.query<RowDataPacket[]>(`
        SELECT id, item_name, quantity, unit_price, description, unit
        FROM items
        ORDER BY id
    `);
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
    
        return result.insertId;
}

export const searchItem = async (keyword: string) => {
    return await pool.query<RowDataPacket[]>(
        `
            SELECT id, item_name, quantity, unit_price, description, unit
            FROM items
            WHERE item_name LIKE ?
        `,
        [`%${keyword}%`]
    );
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
};

export const deleteItem = async (id: number) => {
    return await pool.query<ResultSetHeader>(
        `
            DELETE FROM items
             WHERE id = ?
        `,
        [id]
    );
}