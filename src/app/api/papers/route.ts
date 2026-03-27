import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId");
  const status = searchParams.get("status");

  const siteId = searchParams.get("siteId");

  const where: Record<string, unknown> = {};
  if (siteId) {
    where.session = { day: { siteId: parseInt(siteId) } };
  }
  if (sessionId) where.sessionId = parseInt(sessionId);
  if (status) where.status = status;

  const papers = await prisma.paper.findMany({
    where,
    orderBy: { sortOrder: "asc" },
    include: {
      speaker: true,
      session: { include: { day: true } },
    },
  });

  return NextResponse.json(papers);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const paper = await prisma.paper.create({
    data: {
      sessionId: body.sessionId,
      speakerId: body.speakerId,
      titleZh: body.titleZh,
      titleEn: body.titleEn,
      abstract: body.abstract,
      status: body.status || "draft",
      sortOrder: body.sortOrder || 0,
    },
  });

  return NextResponse.json(paper, { status: 201 });
}
