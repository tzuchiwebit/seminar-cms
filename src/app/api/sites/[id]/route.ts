import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const site = await prisma.site.findUnique({
    where: { id: parseInt(id) },
    include: {
      _count: {
        select: {
          speakers: true,
          days: true,
          registrations: true,
          venues: true,
          exhibitions: true,
        },
      },
    },
  });

  if (!site) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(site);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const site = await prisma.site.update({
    where: { id: parseInt(id) },
    data: {
      name: body.name,
      slug: body.slug,
      domain: body.domain,
      logo: body.logo,
      status: body.status,
    },
  });

  return NextResponse.json(site);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.site.delete({ where: { id: parseInt(id) } });
  return NextResponse.json({ message: "Deleted" });
}
