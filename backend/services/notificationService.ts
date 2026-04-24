import type { PushPayload } from "../types/PushPayload.js";

export const sendPushToUser = async ({
    externalId,
    title,
    body,
}: PushPayload) => {
    const res = await fetch("https://api.onesignal.com/notifications", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Key ${process.env.ONESIGNAL_REST_API_KEY}`,
        },
        body: JSON.stringify({
            app_id: process.env.ONESIGNAL_APP_ID,
            target_channel: "push",
            include_aliases: {
                external_id: [externalId],
            },
            headings: { ja: title },
            contents: { ja: body },
        }),
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
    }

    return res.json();
}