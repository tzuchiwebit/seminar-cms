// One-off: mirror PocketBase `venues` → Drust `venues`.
// Image field stored as resolved PB public URL (not re-uploaded to Garage).

import { spawn } from 'node:child_process';

const PB = 'https://academic-events.pockethost.io';
const HELPER = new URL('./drust-mcp.mjs', import.meta.url).pathname.replace(/^\//, '');

function drust(calls) {
  return new Promise((resolve, reject) => {
    const p = spawn('node', [HELPER, JSON.stringify(calls)], { stdio: ['ignore', 'pipe', 'inherit'] });
    let out = '';
    p.stdout.on('data', (c) => (out += c));
    p.on('close', (code) => (code === 0 ? resolve(out) : reject(new Error(`helper exit ${code}`))));
  });
}

async function main() {
  const res = await fetch(`${PB}/api/collections/venues/records?perPage=100`);
  const { items } = await res.json();
  console.log(`Fetched ${items.length} venues from PocketBase`);

  const calls = items.map((r) => ({
    method: 'tool',
    name: 'insert_record',
    args: {
      collection: 'venues',
      data: {
        pb_id: r.id,
        name: r.name ?? null,
        name_zh: r.nameZh ?? null,
        description: r.description ?? null,
        description_en: r.descriptionEn ?? null,
        address: r.address ?? null,
        map_url: r.mapUrl ?? null,
        capacity: r.capacity ?? 0,
        image: r.image ? `${PB}/api/files/${r.collectionId}/${r.id}/${r.image}` : null,
        site: r.site ?? null,
        type: r.type ?? null,
      },
    },
  }));

  calls.push({ method: 'tool', name: 'count_rows', args: { name: 'venues' } });
  calls.push({ method: 'tool', name: 'sample_rows', args: { name: 'venues', n: 10 } });

  const out = await drust(calls);
  console.log(out);
}

main().catch((e) => { console.error(e); process.exit(1); });
