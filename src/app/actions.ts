"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSessionFromIdToken, destroySession, getCurrentUser } from "@/lib/auth";
import { ASSESSMENT_ITEMS, scoreResponses } from "@/lib/assessment-items";
import { compatibilityScore, icebreakers } from "@/lib/matching";
import { adminAuth, adminDb, adminStorage } from "@/lib/firebase/admin";
import {
  createUserProfile,
  ensureInstrument,
  likeId,
  matchPairId,
} from "@/lib/firebase/users";
import {
  exchangeCustomToken,
  friendlyAuthError,
  signInEmailPassword,
  signUpEmailPassword,
} from "@/lib/firebase/identity";
import type { AssessmentSessionDoc, MatchDoc, MessageDoc } from "@/lib/firebase/types";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function signupAction(formData: FormData) {
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") || "");
  const displayName = String(formData.get("displayName") || "").trim();
  const birthYear = Number(formData.get("birthYear") || 0);

  if (!email || password.length < 6 || !displayName || birthYear < 1950) {
    return { error: "Check your details and try again." };
  }
  const age = new Date().getFullYear() - birthYear;
  if (age < 18) return { error: "You must be 18 or older." };

  try {
    const auth = await signUpEmailPassword(email, password);
    await createUserProfile({
      uid: auth.localId,
      email,
      displayName,
      birthYear,
    });
    await createSessionFromIdToken(auth.idToken);
  } catch (err) {
    return { error: friendlyAuthError(err) };
  }
  redirect("/onboarding");
}

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") || "");
  try {
    const auth = await signInEmailPassword(email, password);
    const existing = await adminDb().collection("users").doc(auth.localId).get();
    if (!existing.exists) {
      await createUserProfile({
        uid: auth.localId,
        email,
        displayName: email.split("@")[0] || "Member",
        birthYear: 1996,
      });
    }
    await createSessionFromIdToken(auth.idToken);
  } catch (err) {
    return { error: friendlyAuthError(err) };
  }
  redirect("/discover");
}

export async function magicLinkStubAction(formData: FormData) {
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();
  try {
    const user = await adminAuth().getUserByEmail(email);
    const custom = await adminAuth().createCustomToken(user.uid);
    const auth = await exchangeCustomToken(custom);
    await createSessionFromIdToken(auth.idToken);
    return { ok: true, message: "Magic link stub: signed in (demo only)." };
  } catch {
    return { error: "No account found for that email. Sign up first." };
  }
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}

export async function onboardingAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const intent = String(formData.get("intent") || "either");
  const consent = formData.get("consent") === "on";
  if (!consent) return { error: "Please accept the matching consent to continue." };

  const now = new Date().toISOString();
  await adminDb()
    .collection("users")
    .doc(user.id)
    .update({
      consentVersion: "2026-11-10",
      consentAt: now,
      updatedAt: now,
      "profile.intent": intent,
    });
  redirect("/assessment");
}

export async function saveAssessmentAnswerAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const itemId = String(formData.get("itemId") || "");
  const value = Number(formData.get("value") || 0);
  const latencyMs = Number(formData.get("latencyMs") || 0);
  if (!itemId || value < 1 || value > 5) return { error: "Invalid answer." };

  const instrument = await ensureInstrument();
  const { getInProgressAssessment } = await import("@/lib/firebase/users");
  const open = await getInProgressAssessment(user.id);
  const sessionRef = open
    ? adminDb().collection("assessmentSessions").doc(open.id)
    : adminDb().collection("assessmentSessions").doc();
  let sessionData: AssessmentSessionDoc = open
    ? {
        userId: open.userId,
        instrumentId: open.instrumentId,
        status: open.status,
        startedAt: open.startedAt,
        completedAt: open.completedAt,
        validityScore: open.validityScore,
        traitVector: open.traitVector,
        responses: open.responses || {},
      }
    : {
        userId: user.id,
        instrumentId: instrument.id,
        status: "in_progress",
        startedAt: new Date().toISOString(),
        completedAt: null,
        validityScore: 1,
        traitVector: {},
        responses: {},
      };

  sessionData.responses = {
    ...(sessionData.responses || {}),
    [itemId]: {
      value,
      answeredAt: new Date().toISOString(),
      latencyMs,
    },
  };

  const answered = Object.keys(sessionData.responses);
  const allDone = ASSESSMENT_ITEMS.every((i) => answered.includes(i.id));

  if (allDone) {
    const { traits, validity } = scoreResponses(
      answered.map((id) => ({ itemId: id, value: sessionData.responses[id].value })),
    );
    sessionData = {
      ...sessionData,
      status: validity < 0.5 ? "invalid" : "complete",
      completedAt: new Date().toISOString(),
      validityScore: validity,
      traitVector: traits,
    };
    await sessionRef.set(sessionData, { merge: true });
    redirect("/profile");
  }

  await sessionRef.set(sessionData, { merge: true });
  revalidatePath("/assessment");
  return { ok: true, answered: answered.length };
}

export async function profileAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const displayName = String(formData.get("displayName") || "").trim();
  const bio = String(formData.get("bio") || "").trim();
  const city = String(formData.get("city") || "Cape Town").trim();
  const intent = String(formData.get("intent") || user.profile?.intent || "either");

  if (!displayName) return { error: "Display name is required." };
  if (!user.assessmentSessions[0]) redirect("/assessment");

  const now = new Date().toISOString();
  await adminDb()
    .collection("users")
    .doc(user.id)
    .update({
      updatedAt: now,
      "profile.displayName": displayName,
      "profile.bio": bio,
      "profile.city": city,
      "profile.intent": intent,
      "profile.discoveryReadyAt": now,
    });
  redirect("/discover");
}

export async function swipeAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const toUserId = String(formData.get("toUserId") || "");
  const action = String(formData.get("action") || "");
  if (!toUserId || !["like", "pass"].includes(action)) {
    return { error: "Invalid swipe." };
  }

  const now = new Date().toISOString();
  await adminDb()
    .collection("likes")
    .doc(likeId(user.id, toUserId))
    .set({
      fromUserId: user.id,
      toUserId,
      action,
      createdAt: now,
    });

  let matchId: string | null = null;
  if (action === "like") {
    const reciprocal = await adminDb().collection("likes").doc(likeId(toUserId, user.id)).get();
    if (reciprocal.exists && reciprocal.data()?.action === "like") {
      const [userAId, userBId] = user.id < toUserId ? [user.id, toUserId] : [toUserId, user.id];
      const pairId = matchPairId(user.id, toUserId);
      const meSession = user.assessmentSessions[0];
      const { getLatestCompleteAssessment } = await import("@/lib/firebase/users");
      const themSession = await getLatestCompleteAssessment(toUserId);
      const myTraits = JSON.parse(meSession?.traitVectorJson || "{}");
      const theirTraits = themSession?.traitVector || {};
      const { score, facets } = compatibilityScore(
        myTraits,
        theirTraits,
        meSession?.validityScore ?? 1,
        themSession?.validityScore ?? 1,
      );

      const matchRef = adminDb().collection("matches").doc(pairId);
      const existing = await matchRef.get();
      if (!existing.exists) {
        const match: MatchDoc = {
          userAId,
          userBId,
          score,
          facets,
          matchedAt: now,
          photoUnlockedAt: null,
        };
        await matchRef.set(match);

        const other = await adminDb().collection("users").doc(toUserId).get();
        const otherName = (other.data()?.profile?.displayName as string) || "there";
        const prompts = icebreakers(facets as { label: string; kind: "similar" | "complement" | "preference" }[], otherName);
        const msg: MessageDoc = {
          senderId: user.id,
          body: `Match unlocked (${Math.round(score * 100)}% band). Try an icebreaker:\n- ${prompts.join("\n- ")}`,
          moderatedFlag: false,
          createdAt: now,
        };
        await matchRef.collection("messages").add(msg);
      }
      matchId = pairId;
    }
  }

  revalidatePath("/discover");
  revalidatePath("/matches");
  return { ok: true, matchId };
}

export async function sendMessageAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const matchId = String(formData.get("matchId") || "");
  const body = String(formData.get("body") || "").trim();
  if (!matchId || !body) return { error: "Message required." };

  const matchRef = adminDb().collection("matches").doc(matchId);
  const match = await matchRef.get();
  const data = match.data() as MatchDoc | undefined;
  if (!match.exists || !data || (data.userAId !== user.id && data.userBId !== user.id)) {
    return { error: "Match not found." };
  }

  await matchRef.collection("messages").add({
    senderId: user.id,
    body: body.slice(0, 2000),
    moderatedFlag: false,
    createdAt: new Date().toISOString(),
  } satisfies MessageDoc);

  revalidatePath(`/matches/${matchId}`);
  return { ok: true };
}

export async function uploadMatchPhotoAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const matchId = String(formData.get("matchId") || "");
  const file = formData.get("photo");
  if (!matchId || !(file instanceof File) || file.size === 0) {
    return { error: "Choose a photo." };
  }

  const matchRef = adminDb().collection("matches").doc(matchId);
  const match = await matchRef.get();
  const data = match.data() as MatchDoc | undefined;
  if (!match.exists || !data || (data.userAId !== user.id && data.userBId !== user.id)) {
    return { error: "Match not found." };
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const ext =
    (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const filename = `${Date.now()}.${ext}`;
  let photoUrl: string;

  try {
    const bucket = adminStorage().bucket();
    const objectPath = `match-photos/${user.id}/${filename}`;
    const gcsFile = bucket.file(objectPath);
    await gcsFile.save(bytes, {
      metadata: { contentType: file.type || `image/${ext}` },
      resumable: false,
    });
    await gcsFile.makePublic().catch(() => undefined);
    photoUrl = `https://storage.googleapis.com/${bucket.name}/${objectPath}`;
  } catch {
    // Storage may be unavailable until billing/bucket is enabled — local fallback for MVP demos
    const dir = path.join(process.cwd(), "public", "uploads");
    await mkdir(dir, { recursive: true });
    const localName = `${user.id}-${filename}`;
    await writeFile(path.join(dir, localName), bytes);
    photoUrl = `/uploads/${localName}`;
  }

  await adminDb()
    .collection("users")
    .doc(user.id)
    .update({
      updatedAt: new Date().toISOString(),
      "profile.photoUrl": photoUrl,
    });
  if (!data.photoUnlockedAt) {
    await matchRef.set({ photoUnlockedAt: new Date().toISOString() }, { merge: true });
  }

  revalidatePath(`/matches/${matchId}`);
  return { ok: true, photoUrl };
}
