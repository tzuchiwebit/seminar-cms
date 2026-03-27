import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const siteId = searchParams.get("siteId");
  const dayNumber = searchParams.get("day");

  if (!siteId) {
    return NextResponse.json({ error: "siteId required" }, { status: 400 });
  }

  const where: Record<string, unknown> = { siteId: parseInt(siteId) };
  if (dayNumber) where.dayNumber = parseInt(dayNumber);

  const days = await prisma.day.findMany({
    where,
    orderBy: { dayNumber: "asc" },
    include: {
      sessions: {
        orderBy: { sortOrder: "asc" },
        include: {
          sessionSpeakers: {
            include: { speaker: true },
          },
          papers: {
            orderBy: { sortOrder: "asc" },
            include: { speaker: true },
          },
        },
      },
    },
  });

  return NextResponse.json(days);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  if (body.type === "day") {
    const day = await prisma.day.create({
      data: {
        siteId: body.siteId,
        dayNumber: body.dayNumber,
        date: new Date(body.date),
        titleZh: body.titleZh,
        titleEn: body.titleEn,
      },
    });
    return NextResponse.json(day, { status: 201 });
  }

  if (body.type === "session") {
    const session = await prisma.session.create({
      data: {
        dayId: body.dayId,
        type: body.sessionType,
        titleZh: body.titleZh,
        titleEn: body.titleEn,
        subtitleZh: body.subtitleZh,
        subtitleEn: body.subtitleEn,
        startTime: body.startTime,
        duration: body.duration,
        venue: body.venue,
        capacity: body.capacity,
        sortOrder: body.sortOrder || 0,
      },
    });
    return NextResponse.json(session, { status: 201 });
  }

  return NextResponse.json({ error: "Invalid type" }, { status: 400 });
}
