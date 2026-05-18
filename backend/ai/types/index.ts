export interface Customer {
    name: string;
    email: string;
    phone: string;
    company: string | null;
    prefecture: string;
    plan: "free" | "basic" | "pro";
};

export interface Staff {
    name: string;
    role: "cleaner" | "technician" | "supervisor";
    is_active: boolean;
}

export interface Holiday {
    date: string;
    name: string;
    is_busy: boolean;
}

export interface Booking {
    customer_id: number;
    staff_id: number;
    service_type: string;
    scheduled_at: string;
    status: "completed" | "scheduled" | "cancelled";
    price: number;
}

export interface Schedule {
    staff_id: number;
    date: string;
    start_time: string;
    end_time: string;
    status: "available" | "booked" | "off";
    booking_id: number | null;
}

export interface Sale {
    date: string;
    total_amount: number;
    booking_count: number;
}