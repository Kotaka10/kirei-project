import type { Skill, StaffWithSkills } from "../types/skillTypes";

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

export const skillApi = {
    getSkills: (token: string) =>
        apiFetch<Skill[]>("/api/skills", token),

    getAllStaffSkills: (token: string) =>
        apiFetch<StaffWithSkills[]>("/api/skills/staff", token),

    getStaffSkills: (token: string, staffId: number) =>
        apiFetch<StaffWithSkills>(`/api/skills/staff/${staffId}`, token),

    updateStaffSkills: (
        token: string,
        staffId: number,
        skills: { skill_id: number; level: number }[]
    ) =>
        apiFetch<StaffWithSkills>(`/api/skills/staff/${staffId}`, token, {
            method: "PUT",
            body:   JSON.stringify({ skills }),
        }),
};
