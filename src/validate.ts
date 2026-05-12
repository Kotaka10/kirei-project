import { z } from "zod";

export const  CustomerSchema = z.object({
    id:               z.number(),
    companyName:      z.string().min(2).max(100),
    zipcode:          z.string().min(6).max(8),
    city:             z.string().min(1).max(30),
    otherAddress:     z.string().min(1).max(30),
    buildingName:     z.string().min(1).max(30),
    emails:           z.array(z.email()),
    phoneNumber:      z.string().regex(/^0[89]0-?\d{4}-?\d{4}$/),
    prefecture:       z.string().min(2).max(10),
    contractDate:     z.string(),
    status:           z.enum(["active", "negotiating", "cancelled"]),
    cancellationDate: z.string()
});

export type Customer = z.infer<typeof CustomerSchema>; //Zod SchemaからTypeScript型を自動生成 → Schema変更すると型も自動同期

export function validateCustomers(raw: unknown[]): {
    valid: Customer[];
    invalid: unknown[];
} {
    const valid: Customer[] = [];
    const invalid: unknown[] = [];

    for (const item of raw) {
        const result = CustomerSchema.safeParse(item);

        if (result.success) {
            valid.push(result.data);
        } else {
            invalid.push(item);
            console.warn("バリデーションNG:", result.error.issues);
        }
    }

    return { valid, invalid };
}