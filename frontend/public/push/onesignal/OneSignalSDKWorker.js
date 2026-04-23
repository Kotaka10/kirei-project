importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");
//importScripts → service worker専用のimport → 外部スクリプトを読み込む
//もしこれがないと通知が届かない・バックグラウンドで動かない
//本番環境ならhttps://とする → そうしないと動かないケースあり　←開発環境でもhttps://にした方がいい　変更して機能したから