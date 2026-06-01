import type { Connection } from "mysql2/promise";
import type { UserContext } from "../../types/auth.js";

// ─────────────────────────────────────────────────────────────
// get_purchase_links
//   資材名をもとに各ECサイトの購入検索URLを返す（Phase 1: URL生成）
// ─────────────────────────────────────────────────────────────
export function getPurchaseLinks(
    _conn: Connection,
    args: { material_name: string; quantity?: number },
    _ctx: UserContext
): object {
    const name     = args.material_name.trim();
    const proQuery = `${name} 業務用`;
    const enc      = (q: string) => encodeURIComponent(q);

    return {
        material_name:      name,
        suggested_quantity: args.quantity ?? null,
        purchase_links: [
            {
                site:     "MonotaRO",
                label:    "MonotaROで探す（プロ向け）",
                url:      `https://www.monotaro.com/s/?c=&q=${enc(proQuery)}`,
                category: "業務・プロ向け",
            },
            {
                site:     "アスクル",
                label:    "アスクルで探す（法人向け）",
                url:      `https://www.askul.co.jp/search/?keyword=${enc(proQuery)}`,
                category: "業務・法人向け",
            },
            {
                site:     "Amazon",
                label:    "Amazonで探す",
                url:      `https://www.amazon.co.jp/s?k=${enc(name)}`,
                category: "一般",
            },
            {
                site:     "楽天市場",
                label:    "楽天市場で探す",
                url:      `https://search.rakuten.co.jp/search/mall/${enc(name)}/`,
                category: "一般",
            },
            {
                site:     "Yahoo!ショッピング",
                label:    "Yahoo!ショッピングで探す",
                url:      `https://shopping.yahoo.co.jp/search?p=${enc(name)}`,
                category: "一般",
            },
        ],
        note: "各サイトの検索結果ページへのリンクです。価格・在庫は時期により変動します。",
    };
}