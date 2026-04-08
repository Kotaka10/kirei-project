import type { RowDataPacket, ResultSetHeader } from "mysql2";
import type { ItemInfoTypes } from "../../../shared/types/ItemInfoTypes.js";
import pool from "../../config/db.js";


export const addItems = async (item: ItemInfoTypes) => {
    const [result] = await pool.query<ResultSetHeader>(
        `
        INSERT INTO items (
            item_name,
            quantity,
            unit,
            unit_price,
            description
        ) VALUES (?, ?, ?, ?, ?)
        `,
        [
            item.itemName,
            item.quantity,
            item.unit,
            item.unitPrice,
            item.description
        ]
    );

    return result.insertId;
}

export const getItems = async () => {
    return await pool.query<RowDataPacket[]>(
        `
        SELECT
            id
            item_name,
            quantity,
            unit,
            unit_price,
            description
        FROM items
        ORDER BY id
        `
    );
}

export const searchItem = async (keyword: string) => {
    return await pool.query<RowDataPacket[]>(
        `
        SELECT
            id,
            item_name,
            quantity,
            unit,
            unit_price,
            description
        FROM items
        WHERE LIKE ?
        `,
        [`%${keyword}%`]
    );
}

export const updateItem = async (id: number, item: ItemInfoTypes) => {
    const [result] = await pool.query<ResultSetHeader>(
        `
        UPDATE items
           SET item_name = ?
               quantity = ?
               unit = ?
               unit_price = ?
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

    return result;
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