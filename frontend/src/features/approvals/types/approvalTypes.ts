export interface AssignmentRequest {
    id:                 number;
    booking_id:         number;
    service_type:       string;
    scheduled_at:       string;
    customer_name:      string;
    target_staff_id:    number;
    target_staff_name:  string;
    requested_by:       number;
    requested_by_name:  string;
    status:             "pending" | "approved" | "rejected";
    note:               string | null;
    created_at:         string;
    approved_by:        number | null;
    approved_by_name:   string | null;
    approved_at:        string | null;
}
