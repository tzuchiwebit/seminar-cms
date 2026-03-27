import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const siteId = searchParams.get("siteId");
  const status = searchParams.get("status");

  const where: Record<string, unknown> = {};
  if (siteId) where.siteId = parseInt(siteId);
  if (status) where.status = status;

  const registrations = await prisma.registration.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(registrations);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const registration = await prisma.registration.create({
    data: {
      siteId: body.siteId,
      name: body.name,
      email: body.email,
      phone: body.phone,
      org: body.org,
      status: "pending",
    },
  });

  return NextResponse.json(registration, { status: 201 });
}
