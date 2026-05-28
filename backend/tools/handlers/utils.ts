/** 半角・全角スペースを除去して名前検索用に正規化する */
export function normalizeNameForSearch(name: string): string {
    return name.replace(/[\s　]/g, "");
}

/**
 * DB カラムの半角・全角スペースを除去して LIKE 検索するための SQL 式を返す
 * 例: nameColumn("c.name") → "REPLACE(REPLACE(c.name, ' ', ''), '　', '')"
 */
export function stripSpacesExpr(column: string): string {
    return `REPLACE(REPLACE(${column}, ' ', ''), '　', '')`;
}
