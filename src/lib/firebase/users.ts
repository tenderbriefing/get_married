import { adminDb } from "./admin";
import type { AppUser, AssessmentSessionDoc, ProfileDoc, UserDoc } from "./types";

function parseDate(value: string | null | undefined) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function likeId(fromUserId: string, toUserId: string) {
  return `${fromUserId}_${toUserId}`;
}

export function matchPairId(a: string, b: string) {
  return a < b ? `${a}_${b}` : `${b}_${a}`;
}

export async function getUserDoc(uid: string) {
  const snap = await adminDb().collection("users").doc(uid).get();
  if (!snap.exists) return null;
  return { id: snap.id, ...(snap.data() as UserDoc) };
}

export async function getLatestCompleteAssessment(uid: string) {
  const snap = await adminDb().collection("assessmentSessions").where("userId", "==", uid).get();
  const complete = snap.docs
    .map((doc) => ({ id: doc.id, ...(doc.data() as AssessmentSessionDoc) }))
    .filter((s) => s.status === "complete")
    .sort((a, b) => String(b.completedAt || "").localeCompare(String(a.completedAt || "")));
  return complete[0] || null;
}

export async function getInProgressAssessment(uid: string) {
  const snap = await adminDb().collection("assessmentSessions").where("userId", "==", uid).get();
  const open = snap.docs
    .map((doc) => ({ id: doc.id, ...(doc.data() as AssessmentSessionDoc) }))
    .filter((s) => s.status === "in_progress")
    .sort((a, b) => String(b.startedAt || "").localeCompare(String(a.startedAt || "")));
  return open[0] || null;
}

export async function toAppUser(uid: string): Promise<AppUser | null> {
  const user = await getUserDoc(uid);
  if (!user) return null;
  const assessment = await getLatestCompleteAssessment(uid);
  const profile = user.profile
    ? {
        ...user.profile,
        discoveryReadyAt: parseDate(user.profile.discoveryReadyAt),
      }
    : null;
  return {
    id: uid,
    email: user.email,
    status: user.status,
    country: user.country,
    locale: user.locale,
    ageVerifiedAt: parseDate(user.ageVerifiedAt),
    consentVersion: user.consentVersion,
    consentAt: parseDate(user.consentAt),
    profile,
    assessmentSessions: assessment
      ? [
          {
            id: assessment.id,
            status: assessment.status,
            completedAt: parseDate(assessment.completedAt),
            validityScore: assessment.validityScore,
            traitVectorJson: JSON.stringify(assessment.traitVector || {}),
          },
        ]
      : [],
  };
}

export async function createUserProfile(params: {
  uid: string;
  email: string;
  displayName: string;
  birthYear: number;
}) {
  const now = new Date().toISOString();
  const profile: ProfileDoc = {
    displayName: params.displayName,
    birthYear: params.birthYear,
    bio: "",
    intent: "either",
    gender: "unspecified",
    seeking: "everyone",
    city: "Cape Town",
    radiusKm: 50,
    dealbreakers: {},
    photoUrl: null,
    discoveryReadyAt: null,
  };
  const user: UserDoc = {
    email: params.email,
    status: "active",
    country: "ZA",
    locale: "en-ZA",
    ageVerifiedAt: now,
    consentVersion: null,
    consentAt: null,
    createdAt: now,
    updatedAt: now,
    profile,
  };
  await adminDb().collection("users").doc(params.uid).set(user);
  return user;
}

export async function touchUser(uid: string, data: Record<string, unknown>) {
  await adminDb()
    .collection("users")
    .doc(uid)
    .update({ ...data, updatedAt: new Date().toISOString() });
}

export async function ensureInstrument() {
  const existing = await adminDb().collection("assessmentInstruments").limit(1).get();
  if (!existing.empty) {
    const doc = existing.docs[0];
    return { id: doc.id, ...doc.data() };
  }
  const { ASSESSMENT_ITEMS } = await import("../assessment-items");
  const ref = adminDb().collection("assessmentInstruments").doc();
  const payload = {
    version: "1.0.0",
    name: "Resona Hybrid v1",
    items: ASSESSMENT_ITEMS,
    createdAt: new Date().toISOString(),
  };
  await ref.set(payload);
  return { id: ref.id, ...payload };
}
