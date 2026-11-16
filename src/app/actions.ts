"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  createSession,
  destroySession,
  getCurrentUser,
  hashPassword,
  verifyPassword,
} from "@/lib/auth";
import { ASSESSMENT_ITEMS, scoreResponses } from "@/lib/assessment-items";
import { compatibilityScore, icebreakers } from "@/lib/matching";
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

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "An account with that email already exists." };

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: await hashPassword(password),
      country: "ZA",
      locale: "en-ZA",
      ageVerifiedAt: new Date(),
      profile: {
        create: {
          displayName,
          birthYear,
          bio: "",
          intent: "either",
          city: "Cape Town",
        },
      },
    },
  });
  await createSession(user.id);
  redirect("/onboarding");
}

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") || "");
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return { error: "Invalid email or password." };
  }
  await createSession(user.id);
  redirect("/discover");
}

export async function magicLinkStubAction(formData: FormData) {
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return { error: "No account found for that email. Sign up first." };
  await createSession(user.id);
  return { ok: true, message: "Magic link stub: signed in (demo only)." };
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

  await prisma.user.update({
    where: { id: user.id },
    data: {
      consentVersion: "2026-11-10",
      consentAt: new Date(),
    },
  });
  await prisma.profile.update({
    where: { userId: user.id },
    data: { intent },
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

  let instrument = await prisma.assessmentInstrument.findFirst({
    orderBy: { createdAt: "desc" },
  });
  if (!instrument) {
    instrument = await prisma.assessmentInstrument.create({
      data: {
        version: "1.0.0",
        name: "Resona Hybrid v1",
        itemsJson: JSON.stringify(ASSESSMENT_ITEMS),
      },
    });
  }

  let session = await prisma.assessmentSession.findFirst({
    where: { userId: user.id, status: "in_progress" },
    orderBy: { startedAt: "desc" },
  });
  if (!session) {
    session = await prisma.assessmentSession.create({
      data: {
        userId: user.id,
        instrumentId: instrument.id,
        status: "in_progress",
      },
    });
  }

  await prisma.assessmentResponse.upsert({
    where: {
      sessionId_itemId: { sessionId: session.id, itemId },
    },
    create: { sessionId: session.id, itemId, value, latencyMs },
    update: { value, latencyMs, answeredAt: new Date() },
  });

  const responses = await prisma.assessmentResponse.findMany({
    where: { sessionId: session.id },
  });
  const answered = new Set(responses.map((r) => r.itemId));
  const allDone = ASSESSMENT_ITEMS.every((i) => answered.has(i.id));

  if (allDone) {
    const { traits, validity } = scoreResponses(
      responses.map((r) => ({ itemId: r.itemId, value: r.value })),
    );
    await prisma.assessmentSession.update({
      where: { id: session.id },
      data: {
        status: validity < 0.5 ? "invalid" : "complete",
        completedAt: new Date(),
        validityScore: validity,
        traitVectorJson: JSON.stringify(traits),
      },
    });
    redirect("/profile");
  }

  revalidatePath("/assessment");
  return { ok: true, answered: answered.size };
}

export async function profileAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const displayName = String(formData.get("displayName") || "").trim();
  const bio = String(formData.get("bio") || "").trim();
  const city = String(formData.get("city") || "Cape Town").trim();
  const intent = String(formData.get("intent") || user.profile?.intent || "either");

  if (!displayName) return { error: "Display name is required." };

  const complete = await prisma.assessmentSession.findFirst({
    where: { userId: user.id, status: "complete" },
  });
  if (!complete) redirect("/assessment");

  await prisma.profile.update({
    where: { userId: user.id },
    data: {
      displayName,
      bio,
      city,
      intent,
      discoveryReadyAt: new Date(),
    },
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

  await prisma.swipe.upsert({
    where: {
      fromUserId_toUserId: { fromUserId: user.id, toUserId },
    },
    create: { fromUserId: user.id, toUserId, action },
    update: { action },
  });

  let matchId: string | null = null;
  if (action === "like") {
    const reciprocal = await prisma.swipe.findUnique({
      where: {
        fromUserId_toUserId: { fromUserId: toUserId, toUserId: user.id },
      },
    });
    if (reciprocal?.action === "like") {
      const [userAId, userBId] =
        user.id < toUserId ? [user.id, toUserId] : [toUserId, user.id];

      const meSession = await prisma.assessmentSession.findFirst({
        where: { userId: user.id, status: "complete" },
        orderBy: { completedAt: "desc" },
      });
      const themSession = await prisma.assessmentSession.findFirst({
        where: { userId: toUserId, status: "complete" },
        orderBy: { completedAt: "desc" },
      });
      const myTraits = JSON.parse(meSession?.traitVectorJson || "{}");
      const theirTraits = JSON.parse(themSession?.traitVectorJson || "{}");
      const { score, facets } = compatibilityScore(
        myTraits,
        theirTraits,
        meSession?.validityScore ?? 1,
        themSession?.validityScore ?? 1,
      );

      const match = await prisma.match.upsert({
        where: { userAId_userBId: { userAId, userBId } },
        create: {
          userAId,
          userBId,
          score,
          facetsJson: JSON.stringify(facets),
          conversation: { create: {} },
        },
        update: {},
        include: { conversation: true },
      });
      matchId = match.id;

      if (match.conversation && meSession && themSession) {
        const other = await prisma.profile.findUnique({ where: { userId: toUserId } });
        const prompts = icebreakers(facets, other?.displayName || "there");
        const existing = await prisma.message.count({
          where: { conversationId: match.conversation.id },
        });
        if (existing === 0) {
          await prisma.message.create({
            data: {
              conversationId: match.conversation.id,
              senderId: user.id,
              body: `Match unlocked (${Math.round(score * 100)}% band). Try an icebreaker:\n- ${prompts.join("\n- ")}`,
            },
          });
        }
      }
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

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { conversation: true },
  });
  if (!match || (match.userAId !== user.id && match.userBId !== user.id)) {
    return { error: "Match not found." };
  }
  if (!match.conversation) return { error: "No conversation." };

  await prisma.message.create({
    data: {
      conversationId: match.conversation.id,
      senderId: user.id,
      body: body.slice(0, 2000),
    },
  });
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

  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match || (match.userAId !== user.id && match.userBId !== user.id)) {
    return { error: "Match not found." };
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const ext =
    (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") ||
    "jpg";
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  const filename = `${user.id}-${Date.now()}.${ext}`;
  await writeFile(path.join(dir, filename), bytes);
  const photoUrl = `/uploads/${filename}`;

  await prisma.profile.update({
    where: { userId: user.id },
    data: { photoUrl },
  });
  if (!match.photoUnlockedAt) {
    await prisma.match.update({
      where: { id: matchId },
      data: { photoUnlockedAt: new Date() },
    });
  }

  revalidatePath(`/matches/${matchId}`);
  return { ok: true, photoUrl };
}
