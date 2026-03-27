import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const speaker = await prisma.speaker.findUnique({
    where: { id: parseInt(id) },
    include: {
      sessionSpeakers: {
        include: { session: { include: { day: true } } },
      },
      papers: true,
    },
  });

  if (!speaker) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(speaker);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const speaker = await prisma.speaker.update({
    where: { id: parseInt(id) },
    data: {
      name: body.name,
      nameEn: body.nameEn,
      affiliation: body.affiliation,
      title: body.title,
      bio: body.bio,
      photo: body.photo,
      status: body.status,
      sortOrder: body.sortOrder,
    },
  });

  return NextResponse.json(speaker);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.speaker.delete({ where: { id: parseInt(id) } });
  return NextResponse.json({ message: "Deleted" });
}
