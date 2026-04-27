// One-off: mirror PocketBase css_variables → Drust, after the main migrate has run.
// Assumes `sites` already exists in Drust.

import fs from 'node:fs';

const DRUST_BASE = 'https://tool.tzuchi-org.tw/drust/t/35d6eba3-a0b7-4f09-9a54-7855fdb417f1';
const TOKEN = process.env.DRUST_TOKEN || 'drust_dlNsbg0x90St8s85Z6BHzfTqH3g2xh2zCwgL5oqGWPQ';
const URL_ = `${DRUST_BASE}/mcp`;

let sessionId = null; let nextId = 1;

function parseSSE(text) {
  let last = null;
  for (const line of text.split('\n')) {
    if (line.startsWith('data: ')) {
      const p = line.slice(6).trim();
      if (!p) continue;
      try { const o = JSON.parse(p); if ('result' in o || 'error' in o) last = o; } catch {}
    }
  }
  return last;
}

async function rpc(method, params, notify) {
  const msg = { jsonrpc: '2.0', method, params };
  if (!notify) msg.id = nextId++;
  const h = { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json', 'Accept': 'application/json, text/event-stream' };
  if (sessionId) h['Mcp-Session-Id'] = sessionId;
  const res = await fetch(URL_, { method: 'POST', headers: h, body: JSON.stringify(msg) });
  if (!sessionId) sessionId = res.headers.get('mcp-session-id');
  if (notify) return null;
  const r = parseSSE(await res.text());
  if (r?.error) throw new Error(`MCP ${method}: ${r.error.message}`);
  return r?.result;
}

async function tool(name, args) {
  const r = await rpc('tools/call', { name, arguments: args || {} });
  const text = r?.content?.[0]?.text;
  let parsed = text; try { parsed = JSON.parse(text); } catch {}
  if (r?.isError) throw new Error(`MCP ${name} isError: ${typeof parsed === 'string' ? parsed : JSON.stringify(parsed)}`);
  return parsed;
}

async function rest(method, path, body) {
  const opts = { method, headers: { 'Authorization': `Bearer ${TOKEN}` } };
  if (body !== undefined) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }
  for (let i = 0; i < 6; i++) {
    const res = await fetch(`${DRUST_BASE}${path}`, opts);
    const text = await res.text();
    if (res.status === 429) {
      const m = text.match(/retry after (\d+)s/i);
      await new Promise(r => setTimeout(r, (m ? parseInt(m[1]) : 2) * 1000 + 200));
      continue;
    }
    if (!res.ok) throw new Error(`REST ${method} ${path} ${res.status}: ${text.slice(0,200)}`);
    try { return JSON.parse(text); } catch { return text; }
  }
  throw new Error(`REST ${method} ${path}: exhausted retries`);
}

// ---------- run ----------
await rpc('initialize', { protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 'css-mirror', version: '1.0' } });
await rpc('notifications/initialized', {}, true);

const existing = (await tool('list_collections')).collections.map(c => c.name);
if (existing.includes('css_variables')) {
  await tool('drop_collection', { collection: 'css_variables' });
  console.log('dropped existing css_variables');
}

await tool('create_collection', {
  name: 'css_variables',
  fields: [
    { name: 'pb_id', sql_type: 'text', nullable: false, unique: true },
    { name: 'site', sql_type: 'integer', foreign_key: 'sites' },
    { name: 'theme_colors', sql_type: 'json' },
    { name: 'theme_typography', sql_type: 'json' },
    { name: 'pb_created', sql_type: 'text' },
    { name: 'pb_updated', sql_type: 'text' },
  ],
});
console.log('created css_variables');

// Build sites pb_id → drust id map via direct REST
const siteRows = await rest('GET', '/records/sites?limit=500');
const siteMap = Object.fromEntries(siteRows.records.map(s => [s.pb_id, s.id]));
console.log('sites map:', siteMap);

const items = JSON.parse(fs.readFileSync('scripts/pb-dump/css_variables.json', 'utf8')).items;
let ok = 0, fail = 0;
for (const r of items) {
  const sitePbId = Array.isArray(r.site) ? r.site[0] : r.site;
  const data = {
    pb_id: r.id,
    site: siteMap[sitePbId] ?? null,
    theme_colors: r.theme_colors ?? null,
    theme_typography: r.theme_typography ?? null,
    pb_created: r.created ?? null,
    pb_updated: r.updated ?? null,
  };
  try {
    await rest('POST', '/records/css_variables', { data });
    ok++;
  } catch (e) {
    fail++;
    console.log(`FAIL ${r.id}: ${e.message}`);
  }
  await new Promise(r => setTimeout(r, 150));
}

const count = (await rest('POST', '/query', { sql: 'SELECT COUNT(*) FROM css_variables' })).rows[0][0];
console.log(`\nok=${ok} fail=${fail} drust row_count=${count}  (pb totalItems=${items.length})`);
