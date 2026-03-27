import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const siteId = parseInt(id);

  const settings = await prisma.siteSetting.findMany({
    where: { siteId },
  });

  // Convert array of { key, value } into a JSON object
  const result: Record<string, string> = {};
  for (const s of settings) {
    result[s.key] = s.value;
  }

  return NextResponse.json(result);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const siteId = parseInt(id);
  const body = await request.json();

  const { key, value } = body as { key: string; value: string };

  if (!key || value === undefined) {
    return NextResponse.json(
      { error: "key and value are required" },
      { status: 400 }
    );
  }

  const setting = await prisma.siteSetting.upsert({
    where: { siteId_key: { siteId, key } },
    update: { value },
    create: { siteId, key, value },
  });

  return NextResponse.json(setting);
}
