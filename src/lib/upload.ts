import sharp from "sharp";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads";

const IMAGE_CONFIG = {
  maxWidth: 1920,
  maxHeight: 1080,
  quality: 80,
};

export async function processAndSaveImage(
  file: File,
  siteId: number,
  category: string = "general"
): Promise<{ filename: string; path: string; size: number }> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const filename = `${randomUUID()}.webp`;
  const dir = path.join(UPLOAD_DIR, String(siteId), category);
  const filePath = path.join(dir, filename);

  await mkdir(dir, { recursive: true });

  const processed = await sharp(buffer)
    .resize(IMAGE_CONFIG.maxWidth, IMAGE_CONFIG.maxHeight, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: IMAGE_CONFIG.quality })
    .toBuffer();

  await writeFile(filePath, processed);

  return {
    filename,
    path: `/uploads/${siteId}/${category}/${filename}`,
    size: processed.length,
  };
}

export async function saveVideo(
  file: File,
  siteId: number,
  category: string = "general"
): Promise<{ filename: string; path: string; size: number }> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = file.name.split(".").pop() || "mp4";
  const filename = `${randomUUID()}.${ext}`;
  const dir = path.join(UPLOAD_DIR, String(siteId), category);
  const filePath = path.join(dir, filename);

  await mkdir(dir, { recursive: true });
  await writeFile(filePath, buffer);

  return {
    filename,
    path: `/uploads/${siteId}/${category}/${filename}`,
    size: buffer.length,
  };
}
