export type PushPayload = {
    externalId: string;
    title: string;
    body: string;
    url?: string;
    data?: Record<string, string | number | boolean | null>;
};
