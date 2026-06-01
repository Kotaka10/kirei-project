import { Connection, type RowDataPacket, type ResultSetHeader } from "mysql2/promise";
import type { UserContext } from "../../types/auth.js";

// ─────────────────────────────────────────────────────────────
// search_knowhow
//   キーワード・カテゴリ・難易度でノウハウを検索する
// ─────────────────────────────────────────────────────────────
export async function searchKnowhow(
    conn: Connection,
    args: {
        keyword?:    string;
        category?:   string;
        difficulty?: "beginner" | "intermediate" | "advanced";
        limit?:      number;
    },
    _ctx: UserContext
): Promise<object> {
    const limit = Math.min(args.limit ?? 5, 10);
    const conditions: string[] = [];
    const params: unknown[]    = [];

    // キーワード検索（title・content・tags を横断）
    if (args.keyword) {
        conditions.push(
            "(title LIKE ? OR content LIKE ? OR tags LIKE ?)"
        );
        const kw = `%${args.keyword}%`;
        params.push(kw, kw, kw);
    }

    // カテゴリフィルタ（部分一致 or 全般 NULL も含む）
    if (args.category) {
        conditions.push("(category LIKE ? OR category IS NULL)");
        params.push(`%${args.category}%`);
    }

    // 難易度フィルタ
    if (args.difficulty) {
        conditions.push("difficulty = ?");
        params.push(args.difficulty);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const [rows] = await conn.query<RowDataPacket[]>(
        `SELECT
            id,
            category,
            title,
            content,
            tags,
            difficulty,
            helpful_count,
            posted_by_name,
            created_at
         FROM knowhow
         ${where}
         ORDER BY
             -- カテゴリ指定がある場合は完全一致を優先
             ${args.category ? "CASE WHEN category = ? THEN 0 ELSE 1 END," : ""}
             helpful_count DESC,
             created_at DESC
         LIMIT ?`,
        args.category ? [...params, args.category, limit] : [...params, limit]
    );

    if (rows.length === 0) {
        // フォールバック: キーワードなしで同カテゴリの全件を返す
        if (args.keyword && args.category) {
            return searchKnowhow(conn, { category: args.category, limit }, _ctx);
        }
        return {
            found: 0,
            message: "該当するノウハウが見つかりませんでした。別のキーワードやカテゴリで試してください。",
        };
    }

    const difficultyLabel: Record<string, string> = {
        beginner:     "初級",
        intermediate: "中級",
        advanced:     "上級",
    };

    const items = rows.map(r => ({
        id:           r.id,
        category:     r.category ?? "全般",
        title:        r.title,
        content:      r.content,
        tags:         r.tags ? (r.tags as string).split(",").map((t: string) => t.trim()) : [],
        difficulty:   difficultyLabel[r.difficulty as string] ?? r.difficulty,
        helpful_count: Number(r.helpful_count),
        posted_by:    r.posted_by_name ?? "システム",
    }));

    return {
        found:   rows.length,
        keyword: args.keyword  ?? null,
        category: args.category ?? null,
        items,
    };
}

// ─────────────────────────────────────────────────────────────
// save_knowhow
//   仕事のノウハウ・コツをデータベースに保存する
// ─────────────────────────────────────────────────────────────
export async function saveKnowhow(
    conn: Connection,
    args: {
        title:       string;
        content:     string;
        category?:   string;
        tags?:       string;
        difficulty?: "beginner" | "intermediate" | "advanced";
    },
    ctx: UserContext
): Promise<object> {
    if (!args.title?.trim()) {
        return { error: "title は必須です" };
    }
    if (!args.content?.trim()) {
        return { error: "content は必須です" };
    }

    // タイトルの重複確認（完全一致）
    const [dupRows] = await conn.query<RowDataPacket[]>(
        `SELECT id FROM knowhow WHERE title = ? LIMIT 1`,
        [args.title.trim()]
    );
    if (dupRows.length > 0) {
        return {
            error:      `「${args.title}」と同じタイトルのノウハウが既に存在します（ID: ${dupRows[0]!.id}）`,
            existing_id: dupRows[0]!.id,
        };
    }

    const [result] = await conn.execute<ResultSetHeader>(
        `INSERT INTO knowhow
         (category, title, content, tags, difficulty, created_by, posted_by_name)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
            args.category  ?? null,
            args.title.trim(),
            args.content.trim(),
            args.tags      ?? null,
            args.difficulty ?? "intermediate",
            ctx.staffId,
            ctx.name,
        ]
    );

    return {
        success:    true,
        id:         result.insertId,
        message:    `ノウハウ「${args.title}」を保存しました。`,
        category:   args.category  ?? "全般",
        difficulty: args.difficulty ?? "intermediate",
        posted_by:  ctx.name,
    };
}

// ─────────────────────────────────────────────────────────────
// mark_knowhow_helpful
//   「参考になった」カウントを +1 する
// ─────────────────────────────────────────────────────────────
export async function markKnowhowHelpful(
    conn: Connection,
    args: { id: number },
    _ctx: UserContext
): Promise<object> {
    const [rows] = await conn.query<RowDataPacket[]>(
        `SELECT id, title FROM knowhow WHERE id = ?`,
        [args.id]
    );
    if (rows.length === 0) {
        return { error: `ノウハウ ID: ${args.id} が見つかりません` };
    }

    await conn.execute(
        `UPDATE knowhow SET helpful_count = helpful_count + 1 WHERE id = ?`,
        [args.id]
    );

    return {
        success: true,
        id:      args.id,
        title:   rows[0]!.title,
        message: `「${rows[0]!.title}」を参考になったとしてカウントしました。`,
    };
}
