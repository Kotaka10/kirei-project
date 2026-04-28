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
            app_id: process.env.ONESIGNAL_APP_ID, //自分のone signalアプリ
            target_channel: "push", //プッシュ通知を使う
            include_aliases: {
                external_id: [externalId], //誰に送るか指定
            },
            headings: { ja: title }, //通知タイトル（日本語）
            contents: { ja: body }, //通知本文
        }),
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
    }

    return res.json();
}