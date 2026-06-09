import { AsyncLocalStorage } from "node:async_hooks";
import mysql from "mysql2/promise";
import type { Connection, Pool } from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

export type DbAuditActorType = "human" | "ai" | "system" | "unknown";

export interface DbAuditContext {
    actorType: DbAuditActorType;
    staffId?: number | undefined;
    actorName?: string | undefined;
    userRole?: string | undefined;
    source?: string | undefined;
    toolName?: string | undefined;
    requestMethod?: string | undefined;
    requestPath?: string | undefined;
}

interface AuditEntry {
    dbMethod:       "query" | "execute";
    action:         string;
    tableName:      string | null;
    sqlPreview:     string;
    parameterCount: number | null;
    affectedRows:   number | null;
    insertId:       number | null;
    success:        boolean;
    errorMessage:   string | null;
    durationMs:     number;
}

const auditContext = new AsyncLocalStorage<DbAuditContext>();

let auditPool: Pool | null = null;
let ensureTablePromise: Promise<void> | null = null;
let lastAuditErrorAt = 0;

const AUDIT_TABLE_SQL = `
    CREATE TABLE IF NOT EXISTS db_audit_logs (
        id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        actor_type      ENUM('human','ai','system','unknown') NOT NULL DEFAULT 'unknown',
        staff_id        INT NULL,
        actor_name      VARCHAR(255) NULL,
        user_role       VARCHAR(32) NULL,
        source          VARCHAR(64) NOT NULL DEFAULT 'unknown',
        tool_name       VARCHAR(128) NULL,
        request_method  VARCHAR(16) NULL,
        request_path    VARCHAR(512) NULL,
        db_method       ENUM('query','execute') NOT NULL,
        action          VARCHAR(24) NOT NULL,
        table_name      VARCHAR(128) NULL,
        sql_preview     TEXT NOT NULL,
        parameter_count INT NULL,
        affected_rows   INT NULL,
        insert_id       BIGINT NULL,
        success         TINYINT(1) NOT NULL DEFAULT 1,
        error_message   TEXT NULL,
        duration_ms     INT NOT NULL,
        created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY idx_db_audit_logs_created_at (created_at),
        KEY idx_db_audit_logs_actor (actor_type, staff_id),
        KEY idx_db_audit_logs_table (table_name, action),
        KEY idx_db_audit_logs_source (source)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
`;

export function runWithDbAuditContext<T>(
    context: Partial<DbAuditContext>, // 全プロパティに?がつくイメージ　actorType?: string;
    callback: () => T,
): T {
    const current = auditContext.getStore();
    const next: DbAuditContext = {
        actorType: context.actorType ?? current?.actorType ?? "unknown",
        staffId: context.staffId ?? current?.staffId,
        actorName: context.actorName ?? current?.actorName,
        userRole: context.userRole ?? current?.userRole,
        source: context.source ?? current?.source,
        toolName: context.toolName ?? current?.toolName,
        requestMethod: context.requestMethod ?? current?.requestMethod,
        requestPath: context.requestPath ?? current?.requestPath,
    };

    return auditContext.run(next, callback);
}

export async function ensureDbAuditTable(): Promise<void> {
    if (!ensureTablePromise) { // 作成されてなければ作る
        ensureTablePromise = getAuditPool()
            .execute(AUDIT_TABLE_SQL)
            .then(() => undefined)
            .catch(error => {
                ensureTablePromise = null;
                throw error;
            });
    }
    await ensureTablePromise; // 完了されるまで待つ
}

export function wrapConnectionForAudit<T extends Connection>(conn: T): T {
    const target = conn as any; // as anyを設けているのは__dbAuditWrappedがConnectionに定義されていないから　つまり独自のプロパティとして扱うから
    if (target.__dbAuditWrapped === true) return conn; //__は命名規則 _name：内部用・直接触らないで、__name：システム内部用・絶対触らないで

    const originalQuery = target.query.bind(conn);
    const originalExecute = target.execute.bind(conn);

    target.query = (...args: any[]) => auditedDbCall("query", args, originalQuery);
    target.execute = (...args: any[]) => auditedDbCall("execute", args, originalExecute);
    target.__dbAuditWrapped = true;

    return conn;
}

export function wrapPoolForAudit<T extends Pool>(pool: T): T {
    const target = pool as any;
    if (target.__dbAuditWrapped === true) return pool;

    const originalQuery = target.query.bind(pool);
    const originalExecute = target.execute.bind(pool);

    target.query = (...args: any[]) => auditedDbCall("query", args, originalQuery);
    target.execute = (...args: any[]) => auditedDbCall("execute", args, originalExecute);
    target.__dbAuditWrapped = true;

    return pool;
}

async function auditedDbCall(
    dbMethod: "query" | "execute",
    args:     any[],
    original: (...args: any[]) => Promise<any>,
): Promise<any> {
    const sql = extractSql(args[0]);
    if (!shouldAuditSql(sql)) {
        return original(...args);
    }

    const startedAt = Date.now();
    const normalizedSql = normalizeSql(sql);
    const parameterCount = countParameters(args);

    try {
        const result = await original(...args);
        const stats = extractResultStats(result);
        await writeAuditLog({
            dbMethod,
            action:       extractAction(normalizedSql),
            tableName:    extractTableName(normalizedSql),
            sqlPreview:   redactSql(normalizedSql).slice(0, 1000),
            parameterCount,
            affectedRows: stats.affectedRows,
            insertId:     stats.insertId,
            success:      true,
            errorMessage: null,
            durationMs:   Date.now() - startedAt,
        });
        return result;
    } catch (error) {
        await writeAuditLog({
            dbMethod,
            action:       extractAction(normalizedSql),
            tableName:    extractTableName(normalizedSql),
            sqlPreview:   redactSql(normalizedSql).slice(0, 1000),
            parameterCount,
            affectedRows: null,
            insertId:     null,
            success:      false,
            errorMessage: error instanceof Error ? error.message.slice(0, 1000) : String(error).slice(0, 1000),
            durationMs:   Date.now() - startedAt,
        });
        throw error;
    }
}

async function writeAuditLog(entry: AuditEntry): Promise<void> {
    try {
        await ensureDbAuditTable();
        const context = auditContext.getStore() ?? { actorType: "unknown" as const };

        await getAuditPool().execute(
            `INSERT INTO db_audit_logs (
                actor_type, staff_id, actor_name, user_role, source, tool_name,
                request_method, request_path, db_method, action, table_name,
                sql_preview, parameter_count, affected_rows, insert_id,
                success, error_message, duration_ms
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                context.actorType,
                nullableNumber(context.staffId),
                context.actorName ?? null,
                context.userRole ?? null,
                context.source ?? "unknown",
                context.toolName ?? null,
                context.requestMethod ?? null,
                context.requestPath ?? null,
                entry.dbMethod,
                entry.action,
                entry.tableName,
                entry.sqlPreview,
                nullableNumber(entry.parameterCount),
                nullableNumber(entry.affectedRows),
                nullableNumber(entry.insertId),
                entry.success ? 1 : 0,
                entry.errorMessage,
                nullableNumber(entry.durationMs),
            ],
        );
    } catch (error) {
        warnAuditError(error);
    }
}

function getAuditPool(): Pool {
    if (!auditPool) {
        auditPool = mysql.createPool({
            host:              process.env.DB_HOST ?? "localhost",
            port:              Number(process.env.DB_PORT ?? 3306),
            user:              process.env.DB_USER ?? "root",
            password:          process.env.DB_PASSWORD ?? "",
            database:          process.env.DB_NAME ?? "kirei_db",
            waitForConnections: true,
            charset:           "utf8mb4",
        });
    }
    return auditPool;
}

function shouldAuditSql(sql: string): boolean {
    const normalized = normalizeSql(sql);
    if (!normalized) return false;
    // \s:空白文字　+:一つ以上 `?:バッククォートがあってもなくてもOK  /i:→ 大文字小文字を無視
    if (/^INSERT\s+INTO\s+`?db_audit_logs`?\b/i.test(normalized)) return false;
    // \b:→ 単語の区切り（INSERTSなどを除外）
    return /^(INSERT|UPDATE|DELETE|REPLACE|CREATE|ALTER|DROP|TRUNCATE)\b/i.test(normalized);
}

function extractSql(input: unknown): string {
    if (typeof input === "string") return input;
    if (input && typeof input === "object" && "sql" in input) {
        const sql = (input as { sql?: unknown }).sql;
        return typeof sql === "string" ? sql : "";
    }
    return "";
}

function countParameters(args: any[]): number | null {
    const params = args[1] ?? (args[0] && typeof args[0] === "object" ? args[0].values : undefined);
    if (!params) return null;
    if (Array.isArray(params)) return params.length;
    if (typeof params === "object") return Object.keys(params).length;
    return 1;
}

function extractResultStats(result: any): { affectedRows: number | null; insertId: number | null } {
    const header = Array.isArray(result) ? result[0] : result;
    if (!header || typeof header !== "object") return { affectedRows: null, insertId: null };

    return {
        affectedRows: typeof header.affectedRows === "number" ? header.affectedRows : null,
        insertId:     typeof header.insertId === "number" && header.insertId > 0 ? header.insertId : null,
    };
}

function normalizeSql(sql: string): string {
    return sql
        .replace(/\/\*[\s\S]*?\*\//g, " ") // /* ～ */ 形式のコメントを削除
        .replace(/--.*$/gm, " ")           // -- から行末までを削除
        .replace(/\s+/g, " ")              // \s はスペース・タブ・改行などの空白文字を表します。それが1つ以上連続 (+) している部分を、スペース1つに変換
        .trim();
}

function redactSql(sql: string): string {
    return sql
        .replace(/'([^'\\]|\\.)*'/g, "'[redacted]'")
        .replace(/"([^"\\]|\\.)*"/g, "\"[redacted]\"");
}

function extractAction(sql: string): string {
    return sql.match(/^([A-Z]+)/i)?.[1]?.toUpperCase() ?? "UNKNOWN";
}

function extractTableName(sql: string): string | null {
    const patterns = [
        /^(?:INSERT|REPLACE)\s+(?:IGNORE\s+)?INTO\s+`?([A-Za-z0-9_]+)`?/i, // ?:は省略可能なグループ
        /^UPDATE\s+`?([A-Za-z0-9_]+)`?/i,
        /^DELETE\s+FROM\s+`?([A-Za-z0-9_]+)`?/i,
        /^CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?`?([A-Za-z0-9_]+)`?/i,
        /^ALTER\s+TABLE\s+`?([A-Za-z0-9_]+)`?/i,
        /^DROP\s+TABLE\s+(?:IF\s+EXISTS\s+)?`?([A-Za-z0-9_]+)`?/i,
        /^TRUNCATE\s+TABLE\s+`?([A-Za-z0-9_]+)`?/i,
    ];

    for (const pattern of patterns) {
        const tableName = sql.match(pattern)?.[1];
        if (tableName) return tableName;
    }
    return null;
}

function warnAuditError(error: unknown): void {
    const now = Date.now();
    if (now - lastAuditErrorAt < 60_000) return;
    lastAuditErrorAt = now;
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[dbAudit] audit log write failed: ${message}`);
}

function nullableNumber(value: number | null | undefined): number | null {
    return typeof value === "number" && Number.isFinite(value) ? value : null;
}
