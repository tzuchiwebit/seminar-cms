// Server-side proxy: browser → /api/drust/* → Drust REST.
// Hides the admin token; adds same-origin access so browser isn't blocked by CORS.
// Only runs when Next.js is in runtime mode (dev + Cloudflare Pages Functions).
// Not compatible with `output: 'export'` in production — intended for local dev + future runtime deployment.

import { NextRequest, NextResponse } from "next/server";

const DRUST_BASE = process.env.DRUST_BASE_URL || "https://tool.tzuchi-org.tw/drust/t/35d6eba3-a0b7-4f09-9a54-7855fdb417f1";
const DRUST_TOKEN = process.env.DRUST_TOKEN || "";

async function forward(req: NextRequest, path: string[]) {
  if (!DRUST_TOKEN) {
    return NextResponse.json({ error: "DRUST_TOKEN not configured on server" }, { status: 500 });
  }
  const url = `${DRUST_BASE}/${path.join("/")}${req.nextUrl.search}`;
  const headers: Record<string, string> = { "Authorization": `Bearer ${DRUST_TOKEN}` };
  const init: RequestInit = { method: req.method, headers };

  if (req.method !== "GET" && req.method !== "HEAD" && req.method !== "DELETE") {
    const ct = req.headers.get("content-type") || "";
    if (ct.startsWith("multipart/form-data")) {
      // Parse, then let fetch re-serialize with a fresh boundary (Content-Type unset
      // so fetch generates the correct multipart header itself).
      const fd = await req.formData();
      init.body = fd;
    } else {
      // JSON / text / other: forward bytes as-is, preserve Content-Type.
      const buf = await req.arrayBuffer();
      if (buf.byteLength > 0) {
        init.body = buf;
        if (ct) headers["Content-Type"] = ct;
      }
    }
  }

  const res = await fetch(url, init);
  // 204/304/1xx must not carry a body — pass through with no body.
  if (res.status === 204 || res.status === 304 || (res.status >= 100 && res.status < 200)) {
    return new NextResponse(null, { status: res.status });
  }
  const body = await res.text();
  return new NextResponse(body, {
    status: res.status,
    headers: { "Content-Type": res.headers.get("content-type") || "application/json" },
  });
}

type RouteContext = { params: Promise<{ path: string[] }> };

export async function GET(req: NextRequest, ctx: RouteContext) {
  const { path } = await ctx.params;
  return forward(req, path);
}
export async function POST(req: NextRequest, ctx: RouteContext) {
  const { path } = await ctx.params;
  return forward(req, path);
}
export async function PATCH(req: NextRequest, ctx: RouteContext) {
  const { path } = await ctx.params;
  return forward(req, path);
}
export async function PUT(req: NextRequest, ctx: RouteContext) {
  const { path } = await ctx.params;
  return forward(req, path);
}
export async function DELETE(req: NextRequest, ctx: RouteContext) {
  const { path } = await ctx.params;
  return forward(req, path);
}
