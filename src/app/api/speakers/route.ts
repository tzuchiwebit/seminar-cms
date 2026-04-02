import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const siteId = searchParams.get("siteId");
  const status = searchParams.get("status");

  const where: Record<string, unknown> = {};
  if (siteId) where.siteId = parseInt(siteId);
  if (status) where.status = status;

  const speakers = await prisma.speaker.findMany({
    where,
    orderBy: { sortOrder: "asc" },
    include: {
      sessionSpeakers: {
        include: { session: { include: { day: true } } },
      },
    },
  });

  return NextResponse.json(speakers);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const speaker = await prisma.speaker.create({
    data: {
      siteId: body.siteId,
      name: body.name,
      nameCn: body.nameCn,
      affiliation: body.affiliation,
      title: body.title,
      bio: body.bio,
      photo: body.photo,
      status: body.status || "draft",
      sortOrder: body.sortOrder || 0,
    },
  });

  return NextResponse.json(speaker, { status: 201 });
}
