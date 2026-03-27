import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const registration = await prisma.registration.update({
    where: { id: parseInt(id) },
    data: {
      status: body.status,
    },
  });

  return NextResponse.json(registration);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.registration.delete({ where: { id: parseInt(id) } });
  return NextResponse.json({ message: "Deleted" });
}
