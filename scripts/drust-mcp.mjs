// Minimal MCP-over-HTTP client for Drust BaaS.
// Usage: node scripts/drust-mcp.mjs '<JSON array of {method, params} calls>'
// First call auto-performs initialize + initialized notification.
// NOTE: This is a learning/scratch helper, not wired into the app.

const URL_ = 'https://tool.tzuchi-org.tw/drust/t/35d6eba3-a0b7-4f09-9a54-7855fdb417f1/mcp';
const TOKEN = process.env.DRUST_TOKEN || 'drust_dlNsbg0x90St8s85Z6BHzfTqH3g2xh2zCwgL5oqGWPQ';

let sessionId = null;
let nextId = 1;

function parseSSE(text) {
  const lines = text.split('\n');
  let last = null;
  for (const line of lines) {
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
    const e = new Error(`MCP ${method} failed: ${resp.error.message || JSON.stringify(resp.error)}`);
    e.data = resp.error;
    throw e;
  }
  return resp ? resp.result : null;
}

async function tool(name, args) {
  return rpc('tools/call', { name, arguments: args || {} });
}

async function main() {
  const calls = JSON.parse(process.argv[2] || '[]');
  await rpc('initialize', {
    protocolVersion: '2025-03-26',
    capabilities: {},
    clientInfo: { name: 'drust-helper', version: '1.0' },
  });
  await rpc('notifications/initialized', {}, { notify: true });

  for (const call of calls) {
    try {
      const result = call.method === 'tool'
        ? await tool(call.name, call.args)
        : await rpc(call.method, call.params || {});
      console.log(JSON.stringify({ call, result }, null, 2));
    } catch (e) {
      console.log(JSON.stringify({ call, error: e.message, data: e.data }, null, 2));
    }
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
