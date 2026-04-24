// Drust isomorphic client.
// - Server-side (build, API route): talks directly to Drust with admin token.
// - Client-side (browser): talks to our own /api/drust proxy; token never leaves server.

const DRUST_BASE = process.env.DRUST_BASE_URL || "https://tool.tzuchi-org.tw/drust/t/35d6eba3-a0b7-4f09-9a54-7855fdb417f1";
const DRUST_TOKEN = process.env.DRUST_TOKEN || "";
const PROXY_BASE = "/api/drust";

const isServer = typeof window === "undefined";

async function drustFetch(path: string, init: RequestInit = {}) {
  const url = isServer ? `${DRUST_BASE}${path}` : `${PROXY_BASE}${path}`;
  const headers: Record<string, string> = { ...(init.headers as Record<string, string> || {}) };
  if (isServer && DRUST_TOKEN) headers["Authorization"] = `Bearer ${DRUST_TOKEN}`;
  const res = await fetch(url, { ...init, headers });
  const text = await res.text();
  if (!res.ok) throw new Error(`Drust ${init.method || "GET"} ${path} ${res.status}: ${text.slice(0, 200)}`);
  try { return text ? JSON.parse(text) : null; } catch { return text; }
}

export async function drustQuery(sql: string): Promise<{ column_names: string[]; rows: unknown[][] }> {
  return drustFetch("/query", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sql }),
  });
}

/** Run SELECT and return rows as objects keyed by column name. */
export async function drustQueryObjects<T = Record<string, unknown>>(sql: string): Promise<T[]> {
  const res = await drustQuery(sql);
  const cols = res.column_names || [];
  return (res.rows || []).map((row) => {
    const obj: Record<string, unknown> = {};
    cols.forEach((c, i) => { obj[c] = row[i]; });
    return obj as T;
  });
}

export async function drustListRecords<T = Record<string, unknown>>(
  collection: string,
  params: { where?: string; limit?: number; offset?: number; order_by?: string } = {}
): Promise<T[]> {
  const qs = new URLSearchParams();
  if (params.where) qs.set("where", params.where);
  if (params.limit != null) qs.set("limit", String(params.limit));
  if (params.offset != null) qs.set("offset", String(params.offset));
  if (params.order_by) qs.set("order_by", params.order_by);
  const q = qs.toString();
  const res = await drustFetch(`/records/${collection}${q ? `?${q}` : ""}`);
  return res.records || [];
}

export async function drustGetRecord<T = Record<string, unknown>>(collection: string, id: number): Promise<T | null> {
  try {
    const res = await drustFetch(`/records/${collection}/${id}`);
    return res.record || null;
  } catch {
    return null;
  }
}

/** Escape single quote for embedding into SQL string literal. */
export function sqlStr(s: string): string {
  return `'${s.replace(/'/g, "''")}'`;
}
