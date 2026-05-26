import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../auth/context/AuthContext";
import { skillApi } from "../lib/api";
import type { Skill, StaffWithSkills } from "../types/skillTypes";

export function useStaffSkills() {
    const { token } = useAuth();
    const [staffList, setStaffList]   = useState<StaffWithSkills[]>([]);
    const [skillMaster, setSkillMaster] = useState<Skill[]>([]);
    const [loading, setLoading]       = useState(true);
    const [error, setError]           = useState<string | null>(null);

    const load = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        setError(null);
        try {
            const [staff, skills] = await Promise.all([
                skillApi.getAllStaffSkills(token),
                skillApi.getSkills(token),
            ]);
            setStaffList(staff);
            setSkillMaster(skills);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => { load(); }, [load]);

    const updateSkills = async (
        staffId: number,
        skills: { skill_id: number; level: number }[]
    ): Promise<void> => {
        if (!token) return;
        const updated = await skillApi.updateStaffSkills(token, staffId, skills);
        setStaffList(prev => prev.map(s => s.id === staffId ? updated : s));
    };

    return { staffList, skillMaster, loading, error, reload: load, updateSkills };
}
