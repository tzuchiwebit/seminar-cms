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
  const init: RequestInit = {
    method: req.method,
    headers: {
      "Authorization": `Bearer ${DRUST_TOKEN}`,
      ...(req.headers.get("content-type") ? { "Content-Type": req.headers.get("content-type")! } : {}),
    },
  };
  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = await req.text();
  }
  const res = await fetch(url, init);
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
