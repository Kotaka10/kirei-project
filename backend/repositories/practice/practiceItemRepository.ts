import type { RowDataPacket, ResultSetHeader } from "mysql2";
import type { ItemInfoTypes } from "../../../shared/types/ItemInfoTypes.js";
import pool from "../../config/db.js";


export const addItem = async (item: ItemInfoTypes) => {
    const [result] = await pool.query<ResultSetHeader>(
        `
        INSERT INTO items(
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

export const getItems = async () => {
    const [rows] = await pool.query<RowDataPacket[]>(
        `
        SELECT
            item_name,
            quantity,
            unit,
            unit_price,
            description
        FROM items
        `
    );

    return rows;
}

export const searchItem = async (keyword: string) => {
    return await pool.query<RowDataPacket[]>(
        `
        SELECT
            item_name,
            quantity,
            unit,
            unit_price,
            description
        FROM items
        WHERE item_name LIKE ?
        `,
        [`%${keyword}%`]
    );
}

export const updateCompany = async (id: number, item: ItemInfoTypes) => {
    const [result] = await pool.query<ResultSetHeader>(
        `
        UPDATE items
            item_nane = ?,
            quantity = ?,
            unit = ?,
            unit_price = ?,
            description = ?
        WHERE id = ?
        `,
        [
            item.itemName,
            item.quantity,
            item.unit,
            item.unitPrice,
            item.description,
            id
        ]
    );

    if (result.affectedRows === 0) {
        return null;
    }

    return {
        ...item,
        id
    };
}

export const deleteItem = async (id: number) => {
    return await pool.query<ResultSetHeader>(
        `
        DELETE FROM items
        WHERE id = ?
        `,
        [id]
    );
}