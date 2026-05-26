export interface AdditionalStaff {
    staff_id:      number;
    staff_name:    string;
    assignment_id: number;
}

export interface Job {
    id:                  number;
    service_type:        string;
    scheduled_at:        string;
    status:              string;
    price:               number;
    customer_name:       string;
    primary_staff_id:    number | null;
    primary_staff_name:  string | null;
    additional_staff:    AdditionalStaff[];
}

export interface StaffOption {
    id:   number;
    name: string;
    role: string;
}
