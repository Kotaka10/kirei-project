import type { Job, StaffOption } from "../types/jobTypes";

const API_BASE = import.meta.env.VITE_API_URL ?? "https://waviness-unsightly-freely.ngrok-free.dev";

async function apiFetch<T>(path: string, token: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            ...options?.headers,
        },
    });
    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `APIエラー (${res.status})`);
    }
    return res.json() as Promise<T>;
}

export const jobApi = {
    getJobs: (token: string, date: string) =>
        apiFetch<Job[]>(`/api/jobs?date=${date}`, token),

    getStaff: (token: string) =>
        apiFetch<StaffOption[]>("/api/jobs/staff", token),

    requestAssignment: (token: string, data: { booking_id: number; target_staff_id: number; note?: string }) =>
        apiFetch<unknown>("/api/assignments", token, {
            method: "POST",
            body:   JSON.stringify(data),
        }),
};
