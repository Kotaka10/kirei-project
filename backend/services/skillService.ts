import { getConnection } from "../db/connection.js";
import { SkillRepository } from "../repositories/skillRepository.js";

const repo = new SkillRepository();

export const getAllSkills = async () => {
    const conn = await getConnection();
    try {
        return await repo.findAllSkills(conn);
    } finally {
        await conn.end();
    }
};

export const getAllStaffWithSkills = async () => {
    const conn = await getConnection();
    try {
        return await repo.findAllStaffWithSkills(conn);
    } finally {
        await conn.end();
    }
};

export const getStaffSkills = async (staffId: number) => {
    const conn = await getConnection();
    try {
        return await repo.findSkillsByStaffId(conn, staffId);
    } finally {
        await conn.end();
    }
};

export const updateStaffSkills = async (
    staffId: number,
    skills: { skill_id: number; level: number }[]
) => {
    const conn = await getConnection();
    try {
        await repo.upsertStaffSkills(conn, staffId, skills);
        return await repo.findSkillsByStaffId(conn, staffId);
    } finally {
        await conn.end();
    }
};

export const getServiceRequirements = async () => {
    const conn = await getConnection();
    try {
        return await repo.findServiceRequirements(conn);
    } finally {
        await conn.end();
    }
};
