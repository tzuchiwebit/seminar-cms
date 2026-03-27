import { prisma } from "@/lib/prisma";

export async function getSiteBySlug(slug: string) {
  return prisma.site.findUnique({
    where: { slug },
    include: {
      settings: true,
      venues: { orderBy: { id: "asc" } },
      exhibitions: true,
    },
  });
}

export async function getSiteDays(siteId: number) {
  return prisma.day.findMany({
    where: { siteId },
    orderBy: { dayNumber: "asc" },
    include: {
      sessions: {
        orderBy: { sortOrder: "asc" },
        include: {
          sessionSpeakers: {
            include: { speaker: true },
          },
          papers: {
            orderBy: { sortOrder: "asc" },
            include: { speaker: true },
          },
        },
      },
    },
  });
}

export async function getSiteSpeakers(siteId: number) {
  return prisma.speaker.findMany({
    where: { siteId },
    orderBy: { sortOrder: "asc" },
    include: {
      sessionSpeakers: {
        include: { session: { include: { day: true } } },
      },
      papers: true,
    },
  });
}

export async function getSiteSettings(siteId: number) {
  const settings = await prisma.siteSetting.findMany({
    where: { siteId },
  });
  const map: Record<string, string> = {};
  for (const s of settings) map[s.key] = s.value;
  return map;
}
