import OneSignal, {
    type NotificationForegroundWillDisplayEvent,
    type NotificationClickEvent,
} from "react-onesignal";

let initPromise: Promise<void> | null = null;

export const initOneSignal = async () => { //one signalの初期化を一回だけ安全に実行する仕組みを作っている
    if (initPromise) return initPromise; //すでに初期化中or完了済みならそれを再利用

    const appId = import.meta.env.VITE_ONESIGNAL_APP_ID;
    if (!appId) throw new Error("VITE_ONESIGNAL_APP_IDが設定されていません");

    initPromise = OneSignal.init({ //初期化のPromiseを保存している
        appId,
        serviceWorkerPath: "push/onesignal/OneSignalSDKWorker.js", //このファイルを使って通知を処理する
        serviceWorkerParam: { scope: "/push/onesignal/" } //Service Workerが影響するURL範囲（担当範囲）
    })
        .then(() => {
            OneSignal.User.PushSubscription.addEventListener("change", (event) => {
                console.log("push change", event);
            })
        })
        .catch((err) => { //失敗したらリセット
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

const waitForSubscription = async () => {
    for (let i = 0; i < 10; i++) {
        const id = OneSignal.User.PushSubscription.id;
        const token = OneSignal.User.PushSubscription.token;

        if (id && token) {
            return {id, token};
        }

        await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    throw new Error("subscriptionId/tokenが取得できません");
}

//setDebugStatus?: (message: string) => void ← message（文字列）を受け取る関数を渡せるけど、無くてもOK　setDebugStatus?.("...") ← 関数があれば実行 無ければ何もしない
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

    await OneSignal.User.PushSubscription.optIn(); //通知ON状態にする

    const subscription = await waitForSubscription();

    setDebugStatus?.(`subscription ready: ${subscription.id}`);

    const status = getOneSignalStatus(); //現在の状態をまとめて取得

    if (!status.token) { //token = 通知送信に必須　ないと通知送れない
        throw new Error(
            `token未発行: permission=${Notification.permission}, optedIn=${status.optedIn}, id=${status.subscriptionId ?? "なし"}`
        );
    }

    return status;
};

export const loginOneSignalUser = async (userId: string) => { //ユーザーと通知紐付ける　→ 誰に通知送るかを識別するため
    await OneSignal.login(`user-${userId}`);
};

export const clearOneSignalUser = async () => { //ユーザー紐付け解除
    await OneSignal.logout();
};

export const setupOneSignalUser = async (
    userId: string | number,
    options: { requestPermission?: boolean; setDebugStatus?: (message: string) => void } = {},
) => {
    await initOneSignal();

    // 1) 先に購読(subscription)を確実に作る
    //    購読が無い状態で login() すると、後から作られた購読に external_id が
    //    紐付かない（OneSignalの既知挙動）。そのため購読を先に確定させる。
    if (options.requestPermission && Notification.permission !== "granted") {
        await requestNotificationPermission(options.setDebugStatus); //内部で optIn + waitForSubscription まで実施
    } else if (Notification.permission === "granted") {
        await OneSignal.User.PushSubscription.optIn();
        await waitForSubscription();
    }

    // 2) 購読ができてから external_id を紐付ける
    await loginOneSignalUser(String(userId));

    return getOneSignalStatus();
};

// プッシュ通知に同梱したカスタムデータ（バックエンドの data フィールド）
export type CaseNotificationData = {
    type?:    string;
    case_id?: number | string;
};

const extractData = (notification?: { additionalData?: object }): CaseNotificationData =>
    (notification?.additionalData ?? {}) as CaseNotificationData;

// 案件のプッシュ通知を受信（フォアグラウンド表示時 / 通知クリック時）したら handler を呼ぶ
// 戻り値はリスナー解除用のクリーンアップ関数
export const onCaseNotification = (
    handler: (data: CaseNotificationData) => void,
): (() => void) => {
    let cancelled = false;
    let detach: (() => void) | null = null;

    // フォアグラウンドで届いたとき（preventDefault は呼ばない → OS通知もそのまま表示）
    const onForeground = (event: NotificationForegroundWillDisplayEvent) => {
        handler(extractData(event.notification));
    };
    // 通知をクリックしてアプリに戻ってきたとき
    const onClick = (event: NotificationClickEvent) => {
        handler(extractData(event.notification));
    };

    void initOneSignal()
        .then(() => {
            if (cancelled) return; //登録前に解除済みなら何もしない
            OneSignal.Notifications.addEventListener("foregroundWillDisplay", onForeground);
            OneSignal.Notifications.addEventListener("click", onClick);
            detach = () => {
                OneSignal.Notifications.removeEventListener("foregroundWillDisplay", onForeground);
                OneSignal.Notifications.removeEventListener("click", onClick);
            };
        })
        .catch((err) => console.warn("[OneSignal] 通知リスナーの登録に失敗", err));

    return () => {
        cancelled = true;
        detach?.();
    };
};
