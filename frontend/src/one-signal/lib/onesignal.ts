import OneSignal from "react-onesignal";

let initPromise: Promise<void> | null = null;

export const initOneSignal = async () => {
    if (initPromise) return initPromise;

    initPromise = OneSignal.init({
        appId: import.meta.env.VITE_ONESIGNAL_APP_ID!,
        serviceWorkerPath: "push/onesignal/OneSignalSDKWorker.js",
        serviceWorkerParam: { scope: "/push/onesignal/" }
    })
        .then(() => {
            console.log("OneSignal init done");

            OneSignal.User.PushSubscription.addEventListener("change", (event) => {
                console.log("push change", event);
            })
        })
        .catch((err) => {
            initPromise = null;
            throw err;
        });

    return initPromise;
};

export const getOneSignalStatus = () => {
    return {
        permission: OneSignal.Notifications.permission, //通知許可状態　granted/denied/default
        optedIn: OneSignal.User.PushSubscription.optedIn, //通知on/off
        subscriptionId: OneSignal.User.PushSubscription.id, //デバイス識別情報
        token: OneSignal.User.PushSubscription.token, //上記同様
    };
};

export const requestNotificationPermission = async (setDebugStatus?: (message: string) => void ) => {
    setDebugStatus?.("isPushSupported確認中...");

    const supported = OneSignal.Notifications.isPushSupported(); //ブラウザが通知対応しているか
    setDebugStatus?.("supported: " + supported);
    
    if (!supported) { //非対応なら無理に進めない
        throw new Error("push not supported")
    }

    setDebugStatus?.("通知許可リクエスト前");

    await OneSignal.Notifications.requestPermission(); //ブラウザの「通知許可しますか？」が出る

    setDebugStatus?.(`通知許可リクエスト後: browser=${Notification.permission}, onesignal=${OneSignal.Notifications.permission}`);

    if (Notification.permission !== "granted") {
        throw new Error(`通知が許可されていません：${Notification.permission}`);
    }

    await OneSignal.User.PushSubscription.optIn();

    setDebugStatus?.("PushSubscription optIn後");

    await new Promise((resolve) => setTimeout(resolve, 2000));

    const status = getOneSignalStatus();

    if (!status.token) {
        throw new Error(
            `token未発行: permission=${Notification.permission}, optedIn=${status.optedIn}, id=${status.subscriptionId ?? "なし"}`
        );
    }

    return status;
};

export const loginOneSignalUser = async (userId: string) => { //ユーザーと通知紐付ける　→ 誰に通知送るかを識別するため
    await OneSignal.login(userId);
};

export const clearOneSignalUser = async () => { //ユーザー紐付け解除
    await OneSignal.logout();
};