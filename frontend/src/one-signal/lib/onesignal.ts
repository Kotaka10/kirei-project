import OneSignal from "react-onesignal";

let initialized = false;

export const initOneSignal = async () => {
    if (initialized) return;

    await OneSignal.init({
        appId: import.meta.env.VITE_ONESIGNAL_APP_ID!, //one signalのappId
        allowLocalhostAsSecureOrigin: true, //localhostでも通知を使えるようにする
        serviceWorkerPath: "push/onesignal/OneSignalSDKWorker.js", //プッシュ通知用のservice workerの場所　service worker → ブラウザの裏で動くスクリプト
        serviceWorkerParam: { scope: "/push/onesignal/" },
    });

    OneSignal.User.PushSubscription.addEventListener("change", (event) => { //通知状態が変わったときに発火
        console.log("push change:", event);
        console.log("optedIn:", event.current.optedIn); //通知onか
        console.log("subscriptionId:", event.current.id); //subscriptionIdの取得
        console.log("token:", event.current.token); //tokenの取得
    })

    initialized = true;
};

export const getOneSignalStatus = () => {
    return {
        permission: OneSignal.Notifications.permission, //通知許可状態　granted/denied/default
        optedIn: OneSignal.User.PushSubscription.optedIn, //通知on/off
        subscriptionId: OneSignal.User.PushSubscription.id, //デバイス識別情報
        token: OneSignal.User.PushSubscription.token, //上記同様
    };
};

export const requestNotificationPermission = async () => {
    await initOneSignal(); //初期化処理
    
    const supported = OneSignal.Notifications.isPushSupported(); //ブラウザが通知対応しているか
    if (!supported) { //非対応なら無理に進めない
        return {
            permission: false,
            optedIn: false,
            subscriptionId: undefined,
            token: undefined,
        };
    }

    await OneSignal.Notifications.requestPermission(); //ブラウザの「通知許可しますか？」が出る

    return getOneSignalStatus(); //状態返す
};

export const loginOneSignalUser = async (userId: string) => { //ユーザーと通知紐付ける　→ 誰に通知送るかを識別するため
    await OneSignal.login(userId);
};

export const clearOneSignalUser = async () => { //ユーザー紐付け解除
    await OneSignal.logout();
};