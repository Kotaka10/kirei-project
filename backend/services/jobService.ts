import { getConnection } from "../db/connection.js";
import { JobRepository } from "../repositories/jobRepository.js";

const repo = new JobRepository();

export const getJobs = async (date: string) => {
    const conn = await getConnection();
    try {
        return await repo.findByDate(conn, date);
    } finally {
        await conn.end();
    }
};

export const getActiveStaff = async () => {
    const conn = await getConnection();
    try {
        return await repo.findAllActiveStaff(conn);
    } finally {
        await conn.end();
    }
};
