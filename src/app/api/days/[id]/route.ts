import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const day = await prisma.day.update({
    where: { id: parseInt(id) },
    data: {
      date: body.date ? new Date(body.date) : undefined,
      titleZh: body.titleZh,
      titleEn: body.titleEn,
    },
  });

  return NextResponse.json(day);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.day.delete({ where: { id: parseInt(id) } });
  return NextResponse.json({ message: "Deleted" });
}
