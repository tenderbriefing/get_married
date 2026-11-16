import { adminDb } from "./firebase/admin";
import { getLatestCompleteAssessment, getUserDoc } from "./firebase/users";
import type { AssessmentSessionDoc, UserDoc } from "./firebase/types";
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

function intentCompatible(a: string, b: string) {
  if (a === "either" || b === "either") return true;
  return a === b;
}

export async function getRankedDiscovery(userId: string): Promise<DiscoveryCard[]> {
  const me = await getUserDoc(userId);
  const myAssessment = await getLatestCompleteAssessment(userId);
  if (!me?.profile?.discoveryReadyAt || !myAssessment) return [];

  const myTraits = (myAssessment.traitVector || {}) as TraitVector;
  const myValidity = myAssessment.validityScore ?? 1;

  const likesSnap = await adminDb()
    .collection("likes")
    .where("fromUserId", "==", userId)
    .get();
  const swipedIds = new Set(likesSnap.docs.map((d) => d.data().toUserId as string));
  swipedIds.add(userId);

  const blocksSnap = await adminDb().collection("blocks").get();
  for (const doc of blocksSnap.docs) {
    const b = doc.data();
    if (b.reporterId === userId) swipedIds.add(b.targetId);
    if (b.targetId === userId) swipedIds.add(b.reporterId);
  }

  const usersSnap = await adminDb().collection("users").where("status", "==", "active").get();
  const year = new Date().getFullYear();
  const cards: DiscoveryCard[] = [];

  for (const doc of usersSnap.docs) {
    if (swipedIds.has(doc.id)) continue;
    const candidate = doc.data() as UserDoc;
    if (!candidate.profile?.discoveryReadyAt) continue;
    if (!intentCompatible(me.profile.intent, candidate.profile.intent)) continue;

    const theirAssessment = await getLatestCompleteAssessment(doc.id);
    if (!theirAssessment) continue;

    const { score, band, facets } = compatibilityScore(
      myTraits,
      (theirAssessment.traitVector || {}) as TraitVector,
      myValidity,
      theirAssessment.validityScore ?? 1,
    );
    cards.push({
      userId: doc.id,
      displayName: candidate.profile.displayName,
      age: year - candidate.profile.birthYear,
      bio: candidate.profile.bio,
      intent: candidate.profile.intent,
      city: candidate.profile.city,
      score,
      band,
      facets,
    });
  }

  cards.sort((a, b) => b.score - a.score);
  return cards;
}

export type { AssessmentSessionDoc };
