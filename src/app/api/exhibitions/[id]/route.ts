import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const exhibition = await prisma.exhibition.update({
    where: { id: parseInt(id) },
    data: {
      titleZh: body.titleZh,
      titleEn: body.titleEn,
      description: body.description,
      startDate: body.startDate ? new Date(body.startDate) : undefined,
      endDate: body.endDate ? new Date(body.endDate) : undefined,
      venue: body.venue,
      image: body.image,
    },
  });

  return NextResponse.json(exhibition);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.exhibition.delete({ where: { id: parseInt(id) } });
  return NextResponse.json({ message: "Deleted" });
}
