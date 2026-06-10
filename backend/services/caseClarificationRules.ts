export interface CaseClarification {
    missingFields: string[];
    questions: string[];
}

export function findRequiredCaseClarification(summary: string): CaseClarification | null {
    const missingFields: string[] = [];
    const questions: string[] = [];

    if (!hasWorkInfo(summary)) {
        missingFields.push("作業内容・サービス種別");
        questions.push("どの作業を行う案件か、清掃内容やサービス種別を教えてください。");
    }

    if (!hasScheduleInfo(summary)) {
        missingFields.push("作業日時・希望時期");
        questions.push("作業予定日、希望時間帯、頻度、または緊急度を教えてください。");
    }

    if (!hasLocationInfo(summary)) {
        missingFields.push("現場場所");
        questions.push("現場の住所、施設名、または市区町村など場所が分かる情報を教えてください。");
    }

    if (!hasSiteTypeInfo(summary)) {
        missingFields.push("現場種別");
        questions.push("現場がオフィス、店舗、マンション、商業施設など、どのような場所か教えてください。");
    }

    if (!hasScaleInfo(summary)) {
        missingFields.push("規模・対象範囲");
        questions.push("面積、台数、部屋数、階数、対象範囲、または作業量の目安を教えてください。");
    }

    if (!hasConditionInfo(summary)) {
        missingFields.push("注意事項・制約");
        questions.push("高所作業、鍵、立入制限、汚れ具合、駐車場、顧客要望などの注意事項を教えてください。特になければ「特になし」と入力してください。");
    }

    return missingFields.length > 0 ? { missingFields, questions } : null;
}

function hasWorkInfo(summary: string): boolean {
    return /(清掃|掃除|洗浄|クリーニング|消毒|除菌|除去|ワックス|剥離|研磨|拭き|ゴミ|廃棄|片付け|原状回復|定期清掃|日常清掃|巡回清掃|床|窓|ガラス|浴室|トイレ|キッチン|レンジフード|エアコン|空調|カーペット|外壁)/.test(summary);
}

function hasScheduleInfo(summary: string): boolean {
    if (/日時未定|日程未定|時期未定|作業日未定|日時不明|日程不明|時期不明/.test(summary)) return false;

    return /(\d{4}[/-]\d{1,2}[/-]\d{1,2}|\d{1,2}月\d{1,2}日|\d{1,2}\/\d{1,2})/.test(summary) ||
        /(今日|本日|明日|明後日|今週|来週|今月|来月|月内|年内|週末|平日|土日|午前|午後|朝|昼|夕方|夜|至急|急ぎ)/.test(summary) ||
        /(毎日|毎週|隔週|毎月|週\d+回|月\d+回|\d+時|\d+:\d{2}|開始予定|完了希望|希望日|期限|納期)/.test(summary);
}

function hasLocationInfo(summary: string): boolean {
    if (/場所未定|住所未定|現場未定|場所不明|住所不明|現場不明/.test(summary)) return false;

    return /(住所|所在地|現場|場所|訪問先|施設名|店舗名|ビル名|マンション名)/.test(summary) ||
        /(都|道|府|県|市|区|町|村|丁目|番地|号室)/.test(summary) ||
        /([\p{Script=Han}\p{Script=Katakana}A-Za-z0-9]+(店|ビル|マンション|ホテル|病院|学校|工場|倉庫))/u.test(summary);
}

function hasSiteTypeInfo(summary: string): boolean {
    return /(オフィス|事務所|店舗|商業施設|施設|マンション|アパート|戸建|住宅|ホテル|病院|クリニック|学校|工場|倉庫|ビル|飲食店|美容室|サロン|共用部|厨房|テナント|ショールーム)/.test(summary);
}

function hasScaleInfo(summary: string): boolean {
    return /(\d+\s*(㎡|m2|平米|坪|台|基|室|部屋|階|フロア|名|人|件|箇所|か所|ヶ所|時間|日間)|延床|面積|台数|部屋数|階数|対象範囲|全館|共用部|一式|大型|小規模|中規模|広い|狭い)/.test(summary);
}

function hasConditionInfo(summary: string): boolean {
    return /(特になし|なし|注意事項|制約|条件|要望|希望|汚れ|ひどい|油汚れ|水垢|カビ|臭い|高所|脚立|危険|鍵|立入|入室|駐車場|車両|夜間|早朝|騒音|養生|荷物|什器|家具|ペット|喫煙|禁煙|セキュリティ|管理会社|担当者|顧客)/.test(summary);
}
