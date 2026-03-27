import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const siteId = searchParams.get("siteId");

  const where: Record<string, unknown> = {};
  if (siteId) where.siteId = parseInt(siteId);

  const exhibitions = await prisma.exhibition.findMany({
    where,
  });

  return NextResponse.json(exhibitions);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const exhibition = await prisma.exhibition.create({
    data: {
      siteId: body.siteId,
      titleZh: body.titleZh,
      titleEn: body.titleEn,
      description: body.description,
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
      venue: body.venue,
      image: body.image,
    },
  });

  return NextResponse.json(exhibition, { status: 201 });
}
