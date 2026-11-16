import { prisma } from "./prisma";
import { compatibilityScore, type Facet } from "./matching";
import type { TraitVector } from "./assessment-items";

export type DiscoveryCard = {
  userId: string;
  displayName: string;
  age: number;
  bio: string;
  intent: string;
  city: string;
  score: number;
  band: string;
  facets: Facet[];
};

function parseTraits(json: string): TraitVector {
  try {
    return JSON.parse(json) as TraitVector;
  } catch {
    return {};
  }
}

function intentCompatible(a: string, b: string) {
  if (a === "either" || b === "either") return true;
  return a === b;
}

export async function getRankedDiscovery(userId: string): Promise<DiscoveryCard[]> {
  const me = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
      assessmentSessions: {
        where: { status: "complete" },
        orderBy: { completedAt: "desc" },
        take: 1,
      },
    },
  });
  if (!me?.profile?.discoveryReadyAt || !me.assessmentSessions[0]) return [];

  const myTraits = parseTraits(me.assessmentSessions[0].traitVectorJson);
  const myValidity = me.assessmentSessions[0].validityScore;

  const swiped = await prisma.swipe.findMany({
    where: { fromUserId: userId },
    select: { toUserId: true },
  });
  const swipedIds = new Set(swiped.map((s) => s.toUserId));
  swipedIds.add(userId);

  const blocked = await prisma.blockReport.findMany({
    where: {
      OR: [{ reporterId: userId }, { targetId: userId }],
    },
  });
  for (const b of blocked) {
    swipedIds.add(b.reporterId === userId ? b.targetId : b.reporterId);
  }

  const year = new Date().getFullYear();
  const candidates = await prisma.user.findMany({
    where: {
      status: "active",
      id: { notIn: Array.from(swipedIds) },
      profile: { discoveryReadyAt: { not: null } },
      assessmentSessions: { some: { status: "complete" } },
    },
    include: {
      profile: true,
      assessmentSessions: {
        where: { status: "complete" },
        orderBy: { completedAt: "desc" },
        take: 1,
      },
    },
  });

  const cards: DiscoveryCard[] = [];
  for (const c of candidates) {
    if (!c.profile || !c.assessmentSessions[0]) continue;
    if (!intentCompatible(me.profile.intent, c.profile.intent)) continue;
    const theirTraits = parseTraits(c.assessmentSessions[0].traitVectorJson);
    const { score, band, facets } = compatibilityScore(
      myTraits,
      theirTraits,
      myValidity,
      c.assessmentSessions[0].validityScore,
    );
    cards.push({
      userId: c.id,
      displayName: c.profile.displayName,
      age: year - c.profile.birthYear,
      bio: c.profile.bio,
      intent: c.profile.intent,
      city: c.profile.city,
      score,
      band,
      facets,
    });
  }

  cards.sort((a, b) => b.score - a.score);
  return cards;
}
