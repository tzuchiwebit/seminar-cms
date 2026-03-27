import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const sites = await prisma.site.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      _count: {
        select: {
          speakers: true,
          days: true,
          registrations: true,
        },
      },
    },
  });

  return NextResponse.json(sites);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const site = await prisma.site.create({
    data: {
      name: body.name,
      slug: body.slug,
      domain: body.domain,
      logo: body.logo,
      status: body.status || "draft",
    },
  });

  return NextResponse.json(site, { status: 201 });
}
