import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const paper = await prisma.paper.update({
    where: { id: parseInt(id) },
    data: {
      titleZh: body.titleZh,
      titleEn: body.titleEn,
      abstract: body.abstract,
      status: body.status,
      sortOrder: body.sortOrder,
      speakerId: body.speakerId,
      sessionId: body.sessionId,
    },
  });

  return NextResponse.json(paper);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.paper.delete({ where: { id: parseInt(id) } });
  return NextResponse.json({ message: "Deleted" });
}
