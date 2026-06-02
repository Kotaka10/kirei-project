import { getConnection } from "../db/connection.js";
import { AssignmentRepository } from "../repositories/assignmentRepository.js";

const repo = new AssignmentRepository();

export const createRequest = async (data: {
    booking_id:      number;
    target_staff_id: number;
    requested_by:    number;
    note?:           string;
}) => {
    const conn = await getConnection();
    try {
        const id = await repo.create(conn, data);
        return await repo.findById(conn, id);
    } finally {
        await conn.end();
    }
};

export const listRequests = async (filters: { status?: string; requestedBy?: number }) => {
    const conn = await getConnection();
    try {
        return await repo.findAll(conn, filters);
    } finally {
        await conn.end();
    }
};

export const getPendingCount = async () => {
    const conn = await getConnection();
    try {
        return await repo.countPending(conn);
    } finally {
        await conn.end();
    }
};

export const approveRequest = async (id: number, approvedBy: number) => {
    const conn = await getConnection();
    try {
        await repo.updateStatus(conn, id, "approved", approvedBy);
        const request = await repo.findById(conn, id);
        if (request) {
            await repo.reflectInSchedule(conn, request.booking_id, request.target_staff_id);
        }
        return request;
    } finally {
        await conn.end();
    }
};

export const rejectRequest = async (id: number, approvedBy: number) => {
    const conn = await getConnection();
    try {
        await repo.updateStatus(conn, id, "rejected", approvedBy);
        return await repo.findById(conn, id);
    } finally {
        await conn.end();
    }
};
