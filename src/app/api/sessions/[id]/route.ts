import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const session = await prisma.session.update({
    where: { id: parseInt(id) },
    data: {
      type: body.type,
      titleZh: body.titleZh,
      titleEn: body.titleEn,
      subtitleZh: body.subtitleZh,
      subtitleEn: body.subtitleEn,
      startTime: body.startTime,
      duration: body.duration,
      venue: body.venue,
      capacity: body.capacity,
      sortOrder: body.sortOrder,
    },
  });

  return NextResponse.json(session);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.session.delete({ where: { id: parseInt(id) } });
  return NextResponse.json({ message: "Deleted" });
}
