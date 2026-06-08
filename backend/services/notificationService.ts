import type { PushPayload } from "../types/PushPayload.js";

export interface OneSignalResponse {
    id?: string;
    recipients?: number;
    external_id?: string;
    errors?: unknown;
}

export const sendPushToUser = async ({
    externalId,
    title,
    body,
    url,
    data,
}: PushPayload): Promise<OneSignalResponse> => {
    const appId = process.env.ONESIGNAL_APP_ID;
    const apiKey = process.env.ONESIGNAL_REST_API_KEY;

    if (!appId || !apiKey) {
        throw new Error("OneSignalの環境変数が設定されていません");
    }

    const res = await fetch("https://api.onesignal.com/notifications", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Key ${apiKey}`,
        },
        body: JSON.stringify({
            app_id: appId, //自分のone signalアプリ
            target_channel: "push", //プッシュ通知を使う
            include_aliases: {
                external_id: [externalId], //誰に送るか指定
            },
            headings: {
                ja: title,
                en: title,
            }, //通知タイトル（日本語）　one signal仕様でenが必要
            contents: {
                ja: body,
                en: body,
            }, //通知本文
            ...(url ? { url } : {}),
            ...(data ? { data } : {}),
        }),
    });

    const text = await res.text();

    if (!res.ok) {
        throw new Error(text);
    }

    return JSON.parse(text) as OneSignalResponse;
}
