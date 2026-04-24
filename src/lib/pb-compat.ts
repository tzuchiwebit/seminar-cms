// PocketBase-compatible adapter that routes data operations to Drust,
// while keeping auth on real PocketBase. Admin components can swap
//   import pb from "@/lib/pb"
// for
//   import pb from "@/lib/pb-compat"
// with zero further code changes.
//
// Supports: collection(name).{getFullList, getFirstListItem, create, update, delete}
//           collection(name).authWithPassword / authWithOAuth2 / authRefresh  (real PB)
//           files.getURL(record, filename)  (Drust: just returns stored URL)
//           authStore                       (real PB)
//
// When NEXT_PUBLIC_DB_BACKEND !== "drust", everything pass-through to real PB.

import PocketBase from "pocketbase";
import { drustQueryObjects, drustListRecords, sqlStr } from "./drust";

const BACKEND = process.env.NEXT_PUBLIC_DB_BACKEND === "drust" ? "drust" : "pb";
const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || "https://academic-events.pockethost.io/";

const realPb = new PocketBase(PB_URL);
realPb.autoCancellation(false);

// Collections that ALWAYS use real PocketBase (auth, uploads temp storage).
const PB_ONLY = new Set(["users", "uploads", "_superusers"]);

// Per-collection relation map: { pbFieldName: targetCollection }
const RELATIONS: Record<string, Record<string, string>> = {
  speakers: { site: "sites" },
  days: { site: "sites" },
  sessions: { day: "days" },
  session_speakers: { session: "sessions", speaker: "speakers" },
  papers: { session: "sessions", speaker: "speakers" },
  venues: { site: "sites" },
  exhibitions: { site: "sites" },
  registrations: { site: "sites" },
  site_settings: { site: "sites" },
  css_variables: { site: "sites" },
};

// Per-collection camelCase → snake_case rename map (only fields that differ).
const PB_TO_DRUST: Record<string, Record<string, string>> = {
  speakers: {
    nameCn: "name_cn",
    titleZh: "title_zh",
    affiliationZh: "affiliation_zh",
    talkTitle: "talk_title",
    talkTitleZh: "talk_title_zh",
    photoCrop: "photo_crop",
    sortOrder: "sort_order",
  },
  days: { dayNumber: "day_number", titleEn: "title_en", titleZh: "title_zh" },
  sessions: {
    titleEn: "title_en",
    titleZh: "title_zh",
    subtitleEn: "subtitle_en",
    subtitleZh: "subtitle_zh",
    startTime: "start_time",
    sortOrder: "sort_order",
    groupPhoto: "group_photo",
  },
  papers: { titleEn: "title_en", titleZh: "title_zh", sortOrder: "sort_order" },
  venues: { nameZh: "name_zh", descriptionEn: "description_en", mapUrl: "map_url" },
  exhibitions: { titleEn: "title_en", titleZh: "title_zh", startDate: "start_date", endDate: "end_date" },
};

// Fields that hold file URLs in Drust (stored as text after upload).
const FILE_FIELDS: Record<string, string[]> = {
  speakers: ["photo"],
  venues: ["image"],
  exhibitions: ["image"],
  sites: ["logo"],
};

function reverseMap(m: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(m).map(([k, v]) => [v, k]));
}

function pbToDrustField(collection: string, field: string): string {
  return PB_TO_DRUST[collection]?.[field] || field;
}

function drustToPbField(collection: string, field: string): string {
  const reverse = PB_TO_DRUST[collection] ? reverseMap(PB_TO_DRUST[collection]) : {};
  return reverse[field] || field;
}

function genPbId(): string {
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  for (let i = 0; i < 15; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

// ---------- Filter parser ----------
// Supports `field="value"`, combined by && / ||.
// Relation fields get translated to JOIN + parent.pb_id.

type ParsedTerm = { field: string; value: string };

function parseTerm(term: string): ParsedTerm {
  const m = term.trim().match(/^(\w+)\s*=\s*["'](.*?)["']$/);
  if (!m) throw new Error(`pb-compat: unsupported filter term: ${term}`);
  return { field: m[1], value: m[2] };
}

function termToSql(collection: string, t: ParsedTerm): string {
  const relations = RELATIONS[collection] || {};
  if (relations[t.field]) {
    return `__p_${t.field}.pb_id = ${sqlStr(t.value)}`;
  }
  const drustField = pbToDrustField(collection, t.field);
  return `t.${drustField} = ${sqlStr(t.value)}`;
}

function filterToWhere(collection: string, filter: string): string {
  // Split on top-level && (no paren nesting in our corpus).
  const andParts = filter.split(/\s+&&\s+/).map((chunk) => {
    const orParts = chunk.split(/\s+\|\|\s+/).map((t) => termToSql(collection, parseTerm(t)));
    return orParts.length > 1 ? `(${orParts.join(" OR ")})` : orParts[0];
  });
  return andParts.join(" AND ");
}

function buildSelectSql(collection: string, filter?: string, sort?: string, limit?: number): string {
  const relations = RELATIONS[collection] || {};
  const selectCols: string[] = ["t.*"];
  const joins: string[] = [];
  for (const [field, target] of Object.entries(relations)) {
    selectCols.push(`__p_${field}.pb_id AS __${field}_pb_id`);
    joins.push(`LEFT JOIN ${target} __p_${field} ON t.${field} = __p_${field}.id`);
  }
  let sql = `SELECT ${selectCols.join(", ")} FROM ${collection} t`;
  if (joins.length) sql += " " + joins.join(" ");
  if (filter) sql += " WHERE " + filterToWhere(collection, filter);
  if (sort) {
    const terms = sort.split(",").map((s) => {
      const trimmed = s.trim();
      const desc = trimmed.startsWith("-");
      const field = desc ? trimmed.slice(1) : trimmed;
      let drustField = pbToDrustField(collection, field);
      if (drustField === "created") drustField = "created_at";
      if (drustField === "updated") drustField = "updated_at";
      return `t.${drustField}${desc ? " DESC" : ""}`;
    });
    sql += " ORDER BY " + terms.join(", ");
  }
  if (limit != null) sql += ` LIMIT ${limit}`;
  return sql;
}

function rowToPbRecord(collection: string, row: Record<string, unknown>): Record<string, unknown> {
  const relations = RELATIONS[collection] || {};
  const reverse = PB_TO_DRUST[collection] ? reverseMap(PB_TO_DRUST[collection]) : {};
  const out: Record<string, unknown> = {
    collectionId: `drust_${collection}`,
    collectionName: collection,
  };
  for (const [k, v] of Object.entries(row)) {
    if (k.startsWith("__") && k.endsWith("_pb_id")) continue;
    if (k === "pb_id") { out.id = v; continue; }
    if (k === "created_at") { out.created = v; continue; }
    if (k === "updated_at") { out.updated = v; continue; }
    if (k === "id") { out._drust_id = v; continue; } // integer id stashed for update/delete lookups
    out[reverse[k] || k] = v;
  }
  for (const field of Object.keys(relations)) {
    const pbId = row[`__${field}_pb_id`];
    out[field] = pbId ?? null;
  }
  return out;
}

// ---------- Drust REST helpers via same-origin proxy ----------

async function drustRest<T = unknown>(method: string, path: string, body?: unknown): Promise<T> {
  const opts: RequestInit = { method, headers: {} };
  if (body !== undefined) {
    (opts.headers as Record<string, string>)["Content-Type"] = "application/json";
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(`/api/drust${path}`, opts);
  const text = await res.text();
  if (!res.ok) throw new Error(`pb-compat ${method} ${path} ${res.status}: ${text.slice(0, 300)}`);
  return text ? (JSON.parse(text) as T) : (undefined as T);
}

async function drustUploadFile(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("visibility", "public");
  const res = await fetch(`/api/drust/files`, { method: "POST", body: fd });
  const text = await res.text();
  if (!res.ok) throw new Error(`pb-compat upload failed ${res.status}: ${text.slice(0, 300)}`);
  const body = JSON.parse(text) as { url?: string };
  if (!body.url) throw new Error("pb-compat: upload returned no url");
  return body.url;
}

async function lookupDrustId(collection: string, pbId: string): Promise<number> {
  const r = await drustRest<{ records: Array<{ id: number }> }>(
    "GET",
    `/records/${collection}?where=${encodeURIComponent(`pb_id = '${pbId.replace(/'/g, "''")}'`)}&limit=1`
  );
  const id = r.records?.[0]?.id;
  if (id == null) throw new Error(`pb-compat: no ${collection} record with pb_id='${pbId}'`);
  return id;
}

async function resolveRelationFKs(collection: string, data: Record<string, unknown>): Promise<Record<string, unknown>> {
  const relations = RELATIONS[collection] || {};
  const out: Record<string, unknown> = { ...data };
  for (const [field, target] of Object.entries(relations)) {
    const v = data[field];
    if (typeof v === "string" && v) {
      out[field] = await lookupDrustId(target, v);
    } else if (v == null || v === "") {
      out[field] = null;
    }
    // integer already → leave as-is
  }
  return out;
}

async function normalizeInput(collection: string, input: Record<string, unknown> | FormData): Promise<Record<string, unknown>> {
  if (!(input instanceof FormData)) return { ...input };
  const out: Record<string, unknown> = {};
  const files: Array<{ field: string; file: File }> = [];
  for (const [key, value] of input.entries()) {
    if (value instanceof File) {
      if (value.size > 0) files.push({ field: key, file: value });
    } else {
      out[key] = value;
    }
  }
  for (const { field, file } of files) {
    out[field] = await drustUploadFile(file);
  }
  return out;
}

// ---------- Adapter implementation ----------

interface DrustCollectionApi {
  getFullList: (opts?: { filter?: string; sort?: string; expand?: string; fields?: string }) => Promise<any[]>;
  getFirstListItem: (filter: string, opts?: { expand?: string }) => Promise<any>;
  getOne: (id: string, opts?: { expand?: string }) => Promise<any>;
  create: (input: Record<string, unknown> | FormData) => Promise<any>;
  update: (id: string, input: Record<string, unknown> | FormData) => Promise<any>;
  delete: (id: string) => Promise<void>;
}

function drustCollection(name: string): DrustCollectionApi {
  async function getFullList(opts: { filter?: string; sort?: string; expand?: string; fields?: string } = {}): Promise<any[]> {
    const sql = buildSelectSql(name, opts.filter, opts.sort);
    const rows = await drustQueryObjects<Record<string, unknown>>(sql);
    const records = rows.map((r) => rowToPbRecord(name, r));
    // expand: pull one relation's target records and attach as record.expand.<field>
    if (opts.expand) {
      const expandFields = opts.expand.split(",").map((s) => s.trim());
      for (const field of expandFields) {
        const target = RELATIONS[name]?.[field];
        if (!target) continue;
        const pbIds = Array.from(new Set(records.map((r) => r[field] as string).filter(Boolean)));
        if (pbIds.length === 0) continue;
        const inList = pbIds.map((id) => sqlStr(id)).join(",");
        const targetSql = buildSelectSql(target) + ` WHERE t.pb_id IN (${inList})`;
        const targetRows = await drustQueryObjects<Record<string, unknown>>(
          buildSelectSql(target, undefined, undefined).replace(
            ` FROM ${target} t`,
            ` FROM ${target} t`
          ) + ` WHERE t.pb_id IN (${inList})`
        );
        const targetMap = new Map<string, Record<string, unknown>>();
        for (const tr of targetRows) {
          const pb = rowToPbRecord(target, tr);
          targetMap.set(pb.id as string, pb);
        }
        for (const r of records) {
          const key = r[field] as string;
          if (!key) continue;
          const expanded = targetMap.get(key);
          if (expanded) {
            r.expand = { ...(r.expand as object || {}), [field]: expanded };
          }
        }
      }
    }
    return records;
  }

  async function getFirstListItem(filter: string, opts: { expand?: string } = {}): Promise<any> {
    const sql = buildSelectSql(name, filter, undefined, 1);
    const rows = await drustQueryObjects<Record<string, unknown>>(sql);
    if (rows.length === 0) {
      const err = new Error("The requested resource wasn't found.");
      (err as { status?: number }).status = 404;
      throw err;
    }
    const records = [rowToPbRecord(name, rows[0])];
    if (opts.expand) {
      // reuse full list expand logic by wrapping
      const listed = await getFullList({ filter, expand: opts.expand });
      return listed[0];
    }
    return records[0];
  }

  async function getOne(id: string, opts: { expand?: string } = {}): Promise<any> {
    return getFirstListItem(`id="${id}"`, opts);
  }

  async function create(input: Record<string, unknown> | FormData): Promise<any> {
    const normalized = await normalizeInput(name, input);
    const resolved = await resolveRelationFKs(name, normalized);
    const drustData: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(resolved)) {
      drustData[pbToDrustField(name, k)] = v;
    }
    drustData.pb_id = genPbId();
    const { record } = await drustRest<{ record: Record<string, unknown> }>("POST", `/records/${name}`, { data: drustData });
    // Refetch with JOINs to get pb_id-shaped relations.
    return getFirstListItem(`id="${record.pb_id}"`).catch(async () => {
      // Fallback: build shape from returned row without JOINs (relations will be integer).
      return rowToPbRecord(name, record);
    });
  }

  async function update(id: string, input: Record<string, unknown> | FormData): Promise<any> {
    const drustId = await lookupDrustId(name, id);
    const normalized = await normalizeInput(name, input);
    const resolved = await resolveRelationFKs(name, normalized);
    const drustData: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(resolved)) {
      drustData[pbToDrustField(name, k)] = v;
    }
    await drustRest("PATCH", `/records/${name}/${drustId}`, { data: drustData });
    return getFirstListItem(`id="${id}"`).catch(() => ({ id, ...drustData }));
  }

  async function deleteRecord(id: string): Promise<void> {
    const drustId = await lookupDrustId(name, id);
    await drustRest("DELETE", `/records/${name}/${drustId}`);
  }

  // Auth methods (collection("users")) are never routed here; we branch at pb.collection().

  return {
    getFullList,
    getFirstListItem,
    getOne,
    create,
    update,
    delete: deleteRecord,
  };
}

// ---------- Default export ----------

const pbCompat = {
  collection(name: string): DrustCollectionApi & {
    authWithPassword: (email: string, password: string) => Promise<any>;
    authWithOAuth2: (opts: any) => Promise<any>;
    authRefresh: () => Promise<any>;
  } {
    if (BACKEND !== "drust" || PB_ONLY.has(name)) {
      return realPb.collection(name) as any;
    }
    return drustCollection(name) as any;
  },
  get authStore() {
    return realPb.authStore;
  },
  files: {
    getURL(record: { [k: string]: unknown } | null | undefined, filename: string, opts?: Record<string, unknown>): string {
      if (!record || !filename) return "";
      // Drust: the field already holds the full URL (stored as text).
      // We can't guess which field, but the common pattern is record.photo/image/logo
      // holds the URL. If `filename` equals the URL (which is what we store), return it.
      // Else fall back to real PB.
      if (typeof filename === "string" && /^https?:\/\//.test(filename)) return filename;
      return realPb.files.getURL(record, filename, opts);
    },
  },
  get baseUrl() {
    return realPb.baseUrl;
  },
};

export default pbCompat;
export { realPb };
