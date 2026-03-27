import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { processAndSaveImage, saveVideo } from "@/lib/upload";

const MAX_SIZE = parseInt(process.env.MAX_FILE_SIZE || "104857600"); // 100MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const siteId = formData.get("siteId") as string;
    const category = (formData.get("category") as string) || "general";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!siteId) {
      return NextResponse.json({ error: "siteId required" }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File too large" }, { status: 413 });
    }

    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");

    if (!isImage && !isVideo) {
      return NextResponse.json(
        { error: "Only images and videos are allowed" },
        { status: 400 }
      );
    }

    let result;
    if (isImage) {
      result = await processAndSaveImage(file, parseInt(siteId), category);
    } else {
      result = await saveVideo(file, parseInt(siteId), category);
    }

    const upload = await prisma.upload.create({
      data: {
        siteId: parseInt(siteId),
        filename: result.filename,
        originalName: file.name,
        mimeType: isImage ? "image/webp" : file.type,
        size: result.size,
        path: result.path,
        category,
      },
    });

    return NextResponse.json(upload, { status: 201 });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const siteId = searchParams.get("siteId");
  const category = searchParams.get("category");

  const where: Record<string, unknown> = {};
  if (siteId) where.siteId = parseInt(siteId);
  if (category) where.category = category;

  const uploads = await prisma.upload.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(uploads);
}
