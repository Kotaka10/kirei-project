import { useState } from 'react';
import { initOneSignal, loginOneSignalUser, requestNotificationPermission } from '../lib/onesignal';
import OneSignal from 'react-onesignal';

export default function useOneSignal() {
  const [status, setStatus] = useState<string>("未実行");

  const handleEnableNotifications = async (userId: string) => {
    setStatus("処理中...");

    try {
      setStatus("OneSignal初期化中...");
      await initOneSignal();

      await requestNotificationPermission();

      await loginOneSignalUser(userId);

      await OneSignal.User.PushSubscription.optIn();

      await new Promise((resolve) => setTimeout(resolve, 2000));

      setStatus(`
        permission: ${OneSignal.Notifications.permission}
        optedIn: ${OneSignal.User.PushSubscription.optedIn}
        subscriptionId: ${OneSignal.User.PushSubscription.id ?? "なし"}
        token: ${OneSignal.User.PushSubscription.token ?? "なし"}
      `);
    } catch (err) {
      console.error(err);
      setStatus("エラー: " + String(err));
    }
  }

  return {
    status,
    handleEnableNotifications
  }
}

