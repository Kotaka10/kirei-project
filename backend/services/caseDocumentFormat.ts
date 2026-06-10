const CASE_DOCUMENT_SECTIONS = [
    {
        heading: "## 1. 案件概要",
        title: "案件概要",
        fallback: (summary: string) => `- ${summary.trim() || "要確認: 案件概要"}`,
    },
    {
        heading: "## 2. 作業目的",
        title: "作業目的",
        fallback: () => "- 要確認: 顧客が解決したい課題と作業完了後の期待状態",
    },
    {
        heading: "## 3. 作業内容",
        title: "作業内容",
        fallback: () => "- 要確認: 実施する清掃・点検・準備作業",
    },
    {
        heading: "## 4. 現場情報",
        title: "現場情報",
        fallback: () => "- 要確認: 場所、現場種別、規模、対象範囲",
    },
    {
        heading: "## 5. 必要スタッフ・スキル",
        title: "必要スタッフ・スキル",
        fallback: () => "- 要確認: 必要人数、役割、経験レベル、専門スキル",
    },
    {
        heading: "## 6. 必要資材・道具",
        title: "必要資材・道具",
        fallback: () => "- 要確認: 使用する清掃資材、機材、保護具、車両",
    },
    {
        heading: "## 7. リスク・注意事項",
        title: "リスク・注意事項",
        fallback: () => "- 要確認: 高所、鍵、立入制限、汚れ具合、騒音、養生などの注意点",
    },
    {
        heading: "## 8. スケジュール目安",
        title: "スケジュール目安",
        fallback: () => "- 要確認: 作業日時、所要時間、頻度、事前準備、完了目安",
    },
    {
        heading: "## 9. 顧客確認事項",
        title: "顧客確認事項",
        fallback: () => "- 要確認: 作業前に顧客へ確認すべき事項",
    },
    {
        heading: "## 10. 次アクション",
        title: "次アクション",
        fallback: () => "- 見積、現地確認、スタッフ手配、顧客連絡の要否を確認する",
    },
];

export const CASE_DOCUMENT_FORMAT_INSTRUCTIONS = `
document は必ず以下のMarkdown見出しを、この順番・表記のまま全て含めてください。
各見出しの本文は箇条書きを中心に、現場でそのまま確認できる具体度で書いてください。
不明な項目は創作せず「要確認: ...」として明記してください。

${CASE_DOCUMENT_SECTIONS.map(section => `${section.heading}\n${section.fallback("")}`).join("\n\n")}
`.trim();

export function normalizeCaseDocument(document: string, summary: string): string {
    const source = document.trim() || `## 1. 案件概要\n- ${summary.trim() || "要確認"}`;
    const hasAnySection = CASE_DOCUMENT_SECTIONS.some(section => findSectionBody(source, section.title));
    const normalizedSections = CASE_DOCUMENT_SECTIONS.map((section, index) => {
        const body = findSectionBody(source, section.title);
        const fallback = section.fallback(summary);
        const preservedBody = index === 0 && !hasAnySection ? preserveOriginalContent(source, summary) : body;
        return `${section.heading}\n${preservedBody || fallback}`;
    });

    return normalizedSections.join("\n\n");
}

function findSectionBody(source: string, title: string): string {
    const sections = findSectionRanges(source);
    const current = sections.find(section => normalizeTitle(section.title) === normalizeTitle(title));
    if (!current) return "";

    return source.slice(current.bodyStart, current.bodyEnd).trim();
}

function findSectionRanges(source: string): Array<{ title: string; bodyStart: number; bodyEnd: number }> {
    // ♯{1, 4}:♯が1~4個、\s*:空白が0個以上、(?:...):グループにするけど取り出さない、[.．、]?:区切り文字（省略可）、g:全件マッチ、m:複数業モード
    const headingPattern = /^#{1,4}\s*(?:\d+[.．、]?\s*)?(.+?)\s*$/gm;
    const matches = [...source.matchAll(headingPattern)];
    return matches.map((match, index) => {
        const next = matches[index + 1];
        return {
            title: String(match[1] ?? ""),
            bodyStart: (match.index ?? 0) + match[0].length,
            bodyEnd: next?.index ?? source.length,
        };
    });
}

function normalizeTitle(title: string): string {
    return title.replace(/[ 　「」『』:：]/g, "").trim();
}

function preserveOriginalContent(source: string, summary: string): string {
    const content = source.trim() || summary.trim();
    return content ? `- 元の概要: ${content}` : "";
}
