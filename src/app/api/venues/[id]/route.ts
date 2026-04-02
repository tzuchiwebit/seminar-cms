import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const venue = await prisma.venue.update({
    where: { id: parseInt(id) },
    data: {
      name: body.name,
      nameZh: body.nameZh,
      description: body.description,
      descriptionEn: body.descriptionEn,
      address: body.address,
      mapUrl: body.mapUrl,
      type: body.type,
      capacity: body.capacity,
      image: body.image,
    },
  });

  return NextResponse.json(venue);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.venue.delete({ where: { id: parseInt(id) } });
  return NextResponse.json({ message: "Deleted" });
}
