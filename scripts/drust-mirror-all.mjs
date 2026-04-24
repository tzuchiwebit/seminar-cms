// Full mirror: PocketBase → Drust, preserving relations as real foreign keys.
//
// Strategy:
//   1. Drop any existing Drust collections in reverse-dependency order (clean slate).
//   2. Create collections in dependency order; FK columns are `integer` with
//      `foreign_key` pointing at the parent Drust collection's auto-id.
//   3. Seed from scripts/pb-dump/*.json. Each insert records the new Drust `id`
//      against the original PB string id in an in-memory map, so the next
//      collection can resolve its FK columns from PB ids → Drust integer ids.
//
// NOTE: Field names are snake_case (Drust rejects camelCase identifiers).
// File fields (logo, photo, image) are stored as resolved PocketBase public URLs
// — files themselves are NOT re-uploaded to Drust's Garage yet.

import fs from 'node:fs';

const DRUST_BASE = 'https://tool.tzuchi-org.tw/drust/t/35d6eba3-a0b7-4f09-9a54-7855fdb417f1';
const URL_ = `${DRUST_BASE}/mcp`;
const TOKEN = process.env.DRUST_TOKEN || 'drust_dlNsbg0x90St8s85Z6BHzfTqH3g2xh2zCwgL5oqGWPQ';
const PB = 'https://academic-events.pockethost.io';

// ---------------- REST helper (preferred for bulk insert; MCP SSE is flaky) ----------------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function rest(method, path, body) {
  const opts = {
    method,
    headers: { 'Authorization': `Bearer ${TOKEN}` },
  };
  if (body !== undefined) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }
  for (let attempt = 1; attempt <= 6; attempt++) {
    const res = await fetch(`${DRUST_BASE}${path}`, opts);
    const text = await res.text();
    if (res.status === 429) {
      const m = text.match(/retry after (\d+)s/i);
      const wait = m ? parseInt(m[1]) * 1000 + 200 : 2000 * attempt;
      process.stdout.write(`   (429 on ${method} ${path}; wait ${wait}ms) `);
      await sleep(wait);
      continue;
    }
    if (!res.ok) throw new Error(`REST ${method} ${path} ${res.status}: ${text.slice(0, 200)}`);
    try { return JSON.parse(text); } catch { return text; }
  }
  throw new Error(`REST ${method} ${path}: exhausted retries`);
}

const restInsert = (collection, data) => rest('POST', `/records/${collection}`, { data });

async function restCount(collection) {
  const q = await rest('POST', '/query', { sql: `SELECT COUNT(*) FROM "${collection}"` });
  return q?.rows?.[0]?.[0] ?? null;
}

// ---------------- MCP helper ----------------
let sessionId = null;
let nextId = 1;

function parseSSE(text) {
  let last = null;
  for (const line of text.split('\n')) {
    if (line.startsWith('data: ')) {
      const payload = line.slice(6).trim();
      if (!payload) continue;
      try {
        const parsed = JSON.parse(payload);
        if ('result' in parsed || 'error' in parsed) last = parsed;
      } catch {}
    }
  }
  return last;
}

async function rpc(method, params, { notify = false } = {}) {
  const msg = { jsonrpc: '2.0', method, params };
  if (!notify) msg.id = nextId++;
  const headers = {
    'Authorization': `Bearer ${TOKEN}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json, text/event-stream',
  };
  if (sessionId) headers['Mcp-Session-Id'] = sessionId;
  const res = await fetch(URL_, { method: 'POST', headers, body: JSON.stringify(msg) });
  if (!sessionId) sessionId = res.headers.get('mcp-session-id');
  if (notify) return null;
  const text = await res.text();
  const resp = parseSSE(text);
  if (resp && resp.error) {
    const err = new Error(`MCP ${method} failed: ${resp.error.message || JSON.stringify(resp.error)}`);
    err.data = resp.error;
    throw err;
  }
  return resp ? resp.result : null;
}

async function tool(name, args) {
  let lastErr;
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      const r = await rpc('tools/call', { name, arguments: args || {} });
      if (!r) throw new Error(`empty response`);
      const first = r.content && r.content[0];
      const text = first && first.type === 'text' ? first.text : null;
      let parsed = text;
      if (text != null) { try { parsed = JSON.parse(text); } catch {} }
      if (r.isError) throw new Error(`isError: ${typeof parsed === 'string' ? parsed : JSON.stringify(parsed)}`);
      return parsed;
    } catch (e) {
      lastErr = e;
      const msg = e.message || '';
      if (attempt < 5 && (msg.includes('empty response') || msg.includes('RATE_LIMITED') || msg.includes('rate limit'))) {
        await sleep(1000 * attempt);
        continue;
      }
      throw e;
    }
  }
  throw lastErr;
}

// ---------------- Collection specs ----------------
const PB_FILE_URL = (r, fname) => `${PB}/api/files/${r.collectionId}/${r.id}/${fname}`;

const specs = [
  {
    name: 'sites',
    fields: [
      { name: 'pb_id', sql_type: 'text', nullable: false, unique: true },
      { name: 'name', sql_type: 'text' },
      { name: 'slug', sql_type: 'text', unique: true },
      { name: 'domain', sql_type: 'text' },
      { name: 'logo', sql_type: 'text' },
      { name: 'status', sql_type: 'text' },
    ],
    xform: (r) => ({
      pb_id: r.id, name: r.name, slug: r.slug, domain: r.domain || null,
      logo: r.logo ? PB_FILE_URL(r, r.logo) : null, status: r.status || null,
    }),
  },
  {
    name: 'speakers',
    fields: [
      { name: 'pb_id', sql_type: 'text', nullable: false, unique: true },
      { name: 'site', sql_type: 'integer', foreign_key: 'sites' },
      { name: 'name', sql_type: 'text' },
      { name: 'name_cn', sql_type: 'text' },
      { name: 'title_field', sql_type: 'text' },
      { name: 'title_zh', sql_type: 'text' },
      { name: 'affiliation', sql_type: 'text' },
      { name: 'affiliation_zh', sql_type: 'text' },
      { name: 'bio', sql_type: 'text' },
      { name: 'talk_title', sql_type: 'text' },
      { name: 'talk_title_zh', sql_type: 'text' },
      { name: 'photo', sql_type: 'text' },
      { name: 'photo_crop', sql_type: 'json' },
      { name: 'sort_order', sql_type: 'integer', default_value: 0 },
      { name: 'status', sql_type: 'text' },
      { name: 'last_updated', sql_type: 'text' },
    ],
    xform: (r, m) => ({
      pb_id: r.id,
      site: r.site ? m.sites[r.site] ?? null : null,
      name: r.name ?? null, name_cn: r.nameCn ?? null,
      title_field: r.title_field ?? null, title_zh: r.titleZh ?? null,
      affiliation: r.affiliation ?? null, affiliation_zh: r.affiliationZh ?? null,
      bio: r.bio ?? null,
      talk_title: r.talkTitle ?? null, talk_title_zh: r.talkTitleZh ?? null,
      photo: r.photo ? PB_FILE_URL(r, r.photo) : null,
      photo_crop: r.photoCrop ?? null,
      sort_order: r.sortOrder ?? 0,
      status: r.status ?? null,
      last_updated: r.last_updated ?? null,
    }),
  },
  {
    name: 'days',
    fields: [
      { name: 'pb_id', sql_type: 'text', nullable: false, unique: true },
      { name: 'site', sql_type: 'integer', foreign_key: 'sites' },
      { name: 'date', sql_type: 'text' },
      { name: 'day_number', sql_type: 'integer', default_value: 0 },
      { name: 'title_en', sql_type: 'text' },
      { name: 'title_zh', sql_type: 'text' },
    ],
    xform: (r, m) => ({
      pb_id: r.id,
      site: r.site ? m.sites[r.site] ?? null : null,
      date: r.date ?? null,
      day_number: r.dayNumber ?? 0,
      title_en: r.titleEn ?? null,
      title_zh: r.titleZh ?? null,
    }),
  },
  {
    name: 'sessions',
    fields: [
      { name: 'pb_id', sql_type: 'text', nullable: false, unique: true },
      { name: 'day', sql_type: 'integer', foreign_key: 'days' },
      { name: 'title_en', sql_type: 'text' },
      { name: 'title_zh', sql_type: 'text' },
      { name: 'subtitle_en', sql_type: 'text' },
      { name: 'subtitle_zh', sql_type: 'text' },
      { name: 'type', sql_type: 'text' },
      { name: 'start_time', sql_type: 'text' },
      { name: 'duration', sql_type: 'integer', default_value: 0 },
      { name: 'capacity', sql_type: 'integer', default_value: 0 },
      { name: 'sort_order', sql_type: 'integer', default_value: 0 },
      { name: 'group_photo', sql_type: 'boolean' },
      { name: 'venue', sql_type: 'text' },
    ],
    xform: (r, m) => ({
      pb_id: r.id,
      day: r.day ? m.days[r.day] ?? null : null,
      title_en: r.titleEn ?? null,
      title_zh: r.titleZh ?? null,
      subtitle_en: r.subtitleEn ?? null,
      subtitle_zh: r.subtitleZh ?? null,
      type: r.type ?? null,
      start_time: r.startTime ?? null,
      duration: r.duration ?? 0,
      capacity: r.capacity ?? 0,
      sort_order: r.sortOrder ?? 0,
      group_photo: !!r.groupPhoto,
      venue: r.venue ?? null,
    }),
  },
  {
    name: 'session_speakers',
    fields: [
      { name: 'pb_id', sql_type: 'text', nullable: false, unique: true },
      { name: 'session', sql_type: 'integer', foreign_key: 'sessions' },
      { name: 'speaker', sql_type: 'integer', foreign_key: 'speakers' },
      { name: 'role', sql_type: 'text' },
    ],
    xform: (r, m) => ({
      pb_id: r.id,
      session: r.session ? m.sessions[r.session] ?? null : null,
      speaker: r.speaker ? m.speakers[r.speaker] ?? null : null,
      role: r.role ?? null,
    }),
  },
  {
    name: 'papers',
    fields: [
      { name: 'pb_id', sql_type: 'text', nullable: false, unique: true },
      { name: 'session', sql_type: 'integer', foreign_key: 'sessions' },
      { name: 'speaker', sql_type: 'integer', foreign_key: 'speakers' },
      { name: 'title_en', sql_type: 'text' },
      { name: 'title_zh', sql_type: 'text' },
      { name: 'abstract', sql_type: 'text' },
      { name: 'sort_order', sql_type: 'integer', default_value: 0 },
      { name: 'status', sql_type: 'text' },
    ],
    xform: (r, m) => ({
      pb_id: r.id,
      session: r.session ? m.sessions[r.session] ?? null : null,
      speaker: r.speaker ? m.speakers[r.speaker] ?? null : null,
      title_en: r.titleEn ?? null,
      title_zh: r.titleZh ?? null,
      abstract: r.abstract ?? null,
      sort_order: r.sortOrder ?? 0,
      status: r.status ?? null,
    }),
  },
  {
    name: 'venues',
    fields: [
      { name: 'pb_id', sql_type: 'text', nullable: false, unique: true },
      { name: 'site', sql_type: 'integer', foreign_key: 'sites' },
      { name: 'name', sql_type: 'text' },
      { name: 'name_zh', sql_type: 'text' },
      { name: 'description', sql_type: 'text' },
      { name: 'description_en', sql_type: 'text' },
      { name: 'address', sql_type: 'text' },
      { name: 'map_url', sql_type: 'text' },
      { name: 'capacity', sql_type: 'integer', default_value: 0 },
      { name: 'image', sql_type: 'text' },
      { name: 'type', sql_type: 'text' },
    ],
    xform: (r, m) => ({
      pb_id: r.id,
      site: r.site ? m.sites[r.site] ?? null : null,
      name: r.name ?? null,
      name_zh: r.nameZh ?? null,
      description: r.description ?? null,
      description_en: r.descriptionEn ?? null,
      address: r.address ?? null,
      map_url: r.mapUrl ?? null,
      capacity: r.capacity ?? 0,
      image: r.image ? PB_FILE_URL(r, r.image) : null,
      type: r.type ?? null,
    }),
  },
  {
    name: 'exhibitions',
    fields: [
      { name: 'pb_id', sql_type: 'text', nullable: false, unique: true },
      { name: 'site', sql_type: 'integer', foreign_key: 'sites' },
      { name: 'title_en', sql_type: 'text' },
      { name: 'title_zh', sql_type: 'text' },
      { name: 'description', sql_type: 'text' },
      { name: 'venue', sql_type: 'text' },
      { name: 'image', sql_type: 'text' },
      { name: 'start_date', sql_type: 'text' },
      { name: 'end_date', sql_type: 'text' },
    ],
    xform: (r, m) => ({
      pb_id: r.id,
      site: r.site ? m.sites[r.site] ?? null : null,
      title_en: r.titleEn ?? null,
      title_zh: r.titleZh ?? null,
      description: r.description ?? null,
      venue: r.venue ?? null,
      image: r.image ? PB_FILE_URL(r, r.image) : null,
      start_date: r.startDate ?? null,
      end_date: r.endDate ?? null,
    }),
  },
  {
    name: 'registrations',
    fields: [
      { name: 'pb_id', sql_type: 'text', nullable: false, unique: true },
      { name: 'site', sql_type: 'integer', foreign_key: 'sites' },
      { name: 'name', sql_type: 'text' },
      { name: 'email', sql_type: 'text' },
      { name: 'organization', sql_type: 'text' },
      { name: 'status', sql_type: 'text', default_value: 'pending' },
    ],
    xform: (r, m) => ({
      pb_id: r.id,
      site: r.site ? m.sites[r.site] ?? null : null,
      name: r.name ?? null,
      email: r.email ?? null,
      organization: r.organization ?? r.org ?? null,
      status: r.status ?? 'pending',
    }),
  },
  {
    name: 'site_settings',
    fields: [
      { name: 'pb_id', sql_type: 'text', nullable: false, unique: true },
      { name: 'site', sql_type: 'integer', foreign_key: 'sites' },
      { name: 'key', sql_type: 'text' },
      { name: 'value', sql_type: 'text' },
    ],
    xform: (r, m) => ({
      pb_id: r.id,
      site: r.site ? m.sites[r.site] ?? null : null,
      key: r.key ?? null,
      value: r.value ?? null,
    }),
  },
];

// ---------------- Main ----------------
async function main() {
  await rpc('initialize', {
    protocolVersion: '2025-03-26',
    capabilities: {},
    clientInfo: { name: 'drust-mirror-all', version: '1.0' },
  });
  await rpc('notifications/initialized', {}, { notify: true });

  // 1. Drop existing collections (reverse dep order)
  const existing = (await tool('list_collections')).collections.map((c) => c.name);
  console.log('Existing Drust collections:', existing);
  const dropOrder = [...specs].reverse().map((s) => s.name);
  for (const name of dropOrder) {
    if (existing.includes(name)) {
      try {
        await tool('drop_collection', { name });
        console.log(`  dropped ${name}`);
      } catch (e) {
        console.log(`  drop ${name} FAILED: ${e.message}`);
      }
    }
  }

  // 2. Create + seed
  const idMap = {}; // { collection: { pb_id: drust_id } }
  for (const spec of specs) {
    idMap[spec.name] = {};
    await tool('create_collection', { name: spec.name, fields: spec.fields });
    console.log(`\n== ${spec.name}: created ==`);

    const dump = JSON.parse(fs.readFileSync(`scripts/pb-dump/${spec.name}.json`, 'utf8'));
    const items = dump.items || [];
    let ok = 0, fail = 0;
    for (const r of items) {
      const data = spec.xform(r, idMap);
      try {
        const res = await restInsert(spec.name, data);
        const drustId = res?.record?.id ?? res?.id;
        if (drustId != null) idMap[spec.name][r.id] = drustId;
        ok++;
      } catch (e) {
        fail++;
        console.log(`   FAIL ${spec.name}/${r.id}: ${e.message}`);
        if (fail <= 3) console.log(`        data: ${JSON.stringify(data)}`);
      }
      await sleep(150); // gentle pacing to reduce 429
    }
    const count = await restCount(spec.name);
    console.log(`   inserted ok=${ok}, fail=${fail}, row_count=${count}`);
  }

  console.log('\n=== SUMMARY ===');
  for (const spec of specs) {
    const count = await restCount(spec.name);
    const pb = JSON.parse(fs.readFileSync(`scripts/pb-dump/${spec.name}.json`, 'utf8')).totalItems;
    const match = pb === count ? 'OK' : 'MISMATCH';
    console.log(`  ${spec.name.padEnd(20)} pb=${pb}  drust=${count}  ${match}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
