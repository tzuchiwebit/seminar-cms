import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const siteId = searchParams.get("siteId");

  const where: Record<string, unknown> = {};
  if (siteId) where.siteId = parseInt(siteId);

  const venues = await prisma.venue.findMany({
    where,
    orderBy: { id: "asc" },
  });

  return NextResponse.json(venues);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const venue = await prisma.venue.create({
    data: {
      siteId: body.siteId,
      name: body.name,
      nameZh: body.nameZh,
      description: body.description,
      descriptionEn: body.descriptionEn,
      address: body.address,
      mapUrl: body.mapUrl,
      type: body.type || "main",
      capacity: body.capacity,
      image: body.image,
    },
  });

  return NextResponse.json(venue, { status: 201 });
}
