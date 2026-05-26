import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../auth/context/AuthContext";
import { jobApi } from "../lib/api";
import type { Job, StaffOption } from "../types/jobTypes";

export function useJobs(date: string) {
    const { token } = useAuth();
    const [jobs,    setJobs]    = useState<Job[]>([]);
    const [staff,   setStaff]   = useState<StaffOption[]>([]);
    const [loading, setLoading] = useState(false);
    const [error,   setError]   = useState<string | null>(null);

    const fetchJobs = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        setError(null);
        try {
            const [j, s] = await Promise.all([
                jobApi.getJobs(token, date),
                jobApi.getStaff(token),
            ]);
            setJobs(j);
            setStaff(s);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, [token, date]);

    useEffect(() => { fetchJobs(); }, [fetchJobs]);

    const requestAssignment = async (bookingId: number, targetStaffId: number, note?: string) => {
        if (!token) return;
        await jobApi.requestAssignment(token, {
            booking_id:      bookingId,
            target_staff_id: targetStaffId,
            note,
        });
    };

    return { jobs, staff, loading, error, refetch: fetchJobs, requestAssignment };
}
