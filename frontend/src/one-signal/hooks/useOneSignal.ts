import { useEffect, useState } from 'react';
import { initOneSignal, loginOneSignalUser, requestNotificationPermission } from '../lib/onesignal';
import OneSignal from 'react-onesignal';

export default function useOneSignal() {
  const [status, setStatus] = useState<string>("未実行");

  useEffect(() => {
    initOneSignal().catch((err) => {
      console.error(err);
      setStatus("初期化エラー: " + String(err));
    });
  }, []);

  const handleEnableNotifications = async (userId: string) => {
    setStatus("処理中...");
    try {
      await requestNotificationPermission();
      await loginOneSignalUser(userId);
      setStatus(`permission: ${OneSignal.Notifications.permission}, optedIn: ${OneSignal.User.PushSubscription.optedIn}`);
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

