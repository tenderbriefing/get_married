/**
 * Seed Firebase Auth + Firestore demo users for Resona.
 * Requires .env.local with NEXT_PUBLIC_FIREBASE_* and FIREBASE_SERVICE_ACCOUNT_PATH.
 */
import { config as loadEnv } from "dotenv";
import { resolve } from "path";
import { existsSync } from "fs";

const envLocal = resolve(process.cwd(), ".env.local");
const envFile = resolve(process.cwd(), ".env");
if (existsSync(envLocal)) loadEnv({ path: envLocal });
else if (existsSync(envFile)) loadEnv({ path: envFile });

import { ASSESSMENT_ITEMS, scoreResponses } from "../src/lib/assessment-items";
import { adminAuth, adminDb } from "../src/lib/firebase/admin";
import { likeId } from "../src/lib/firebase/users";

type SeedUser = {
  email: string;
  displayName: string;
  birthYear: number;
  bio: string;
  intent: string;
  gender: string;
  city: string;
  answers: Record<string, number>;
};

const PASSWORD = "demo1234";

const likertUsers: SeedUser[] = [
  {
    email: "you@resona.app",
    displayName: "Alex",
    birthYear: 1996,
    bio: "Cape Town-based. Curious about people who think carefully and laugh easily.",
    intent: "either",
    gender: "nonbinary",
    city: "Cape Town",
    answers: {
      o1: 5, o2: 2, o3: 4, c1: 4, c2: 2, c3: 4, e1: 3, e2: 3, e3: 3,
      a1: 5, a2: 1, a3: 4, n1: 4, n2: 2, n3: 2, att1: 2, att2: 2, att3: 2, att4: 2,
      v1: 4, v2: 2, v3: 4, v4: 2, v5: 3, v6: 4, cf1: 4, cf2: 2, cf3: 5, cf4: 2,
      s1: 3, s2: 3, attn1: 4, attn2: 1,
    },
  },
  {
    email: "thandi@resona.app",
    displayName: "Thandi",
    birthYear: 1994,
    bio: "Designer who loves hiking Table Mountain and long conversations over coffee.",
    intent: "dating",
    gender: "woman",
    city: "Cape Town",
    answers: {
      o1: 5, o2: 1, o3: 5, c1: 4, c2: 2, c3: 4, e1: 4, e2: 2, e3: 4,
      a1: 5, a2: 1, a3: 5, n1: 4, n2: 2, n3: 2, att1: 2, att2: 2, att3: 2, att4: 1,
      v1: 4, v2: 2, v3: 5, v4: 1, v5: 3, v6: 4, cf1: 5, cf2: 1, cf3: 5, cf4: 2,
      s1: 4, s2: 2, attn1: 4, attn2: 1,
    },
  },
  {
    email: "sam@resona.app",
    displayName: "Sam",
    birthYear: 1992,
    bio: "Engineer by day, board-game host by night. Looking for friendship and maybe more.",
    intent: "either",
    gender: "man",
    city: "Johannesburg",
    answers: {
      o1: 4, o2: 2, o3: 3, c1: 5, c2: 1, c3: 5, e1: 2, e2: 4, e3: 2,
      a1: 4, a2: 2, a3: 4, n1: 4, n2: 3, n3: 2, att1: 3, att2: 2, att3: 3, att4: 3,
      v1: 5, v2: 1, v3: 3, v4: 3, v5: 2, v6: 3, cf1: 4, cf2: 2, cf3: 4, cf4: 3,
      s1: 2, s2: 4, attn1: 5, attn2: 1,
    },
  },
  {
    email: "lerato@resona.app",
    displayName: "Lerato",
    birthYear: 1998,
    bio: "Community organiser. Big on honesty, slow Sundays, and people who repair well.",
    intent: "friendship",
    gender: "woman",
    city: "Durban",
    answers: {
      o1: 4, o2: 2, o3: 4, c1: 4, c2: 2, c3: 3, e1: 5, e2: 1, e3: 5,
      a1: 5, a2: 1, a3: 5, n1: 3, n2: 3, n3: 3, att1: 3, att2: 3, att3: 1, att4: 1,
      v1: 3, v2: 3, v3: 4, v4: 2, v5: 4, v6: 5, cf1: 5, cf2: 1, cf3: 5, cf4: 1,
      s1: 5, s2: 1, attn1: 4, attn2: 1,
    },
  },
  {
    email: "jordan@resona.app",
    displayName: "Jordan",
    birthYear: 1995,
    bio: "Quiet mornings, loud playlists. Dating someone who values calm and curiosity.",
    intent: "dating",
    gender: "nonbinary",
    city: "Cape Town",
    answers: {
      o1: 5, o2: 1, o3: 5, c1: 3, c2: 3, c3: 3, e1: 2, e2: 4, e3: 2,
      a1: 4, a2: 2, a3: 4, n1: 3, n2: 3, n3: 3, att1: 2, att2: 2, att3: 4, att4: 3,
      v1: 3, v2: 3, v3: 5, v4: 1, v5: 2, v6: 3, cf1: 3, cf2: 3, cf3: 4, cf4: 3,
      s1: 2, s2: 4, attn1: 4, attn2: 1,
    },
  },
  {
    email: "amina@resona.app",
    displayName: "Amina",
    birthYear: 1993,
    bio: "Product lead who still believes first dates should feel like good conversations.",
    intent: "dating",
    gender: "woman",
    city: "Pretoria",
    answers: {
      o1: 4, o2: 2, o3: 4, c1: 5, c2: 1, c3: 5, e1: 3, e2: 3, e3: 4,
      a1: 4, a2: 2, a3: 4, n1: 5, n2: 1, n3: 1, att1: 1, att2: 1, att3: 2, att4: 2,
      v1: 5, v2: 1, v3: 3, v4: 3, v5: 4, v6: 4, cf1: 5, cf2: 1, cf3: 4, cf4: 2,
      s1: 3, s2: 3, attn1: 4, attn2: 1,
    },
  },
];

async function upsertAuthUser(email: string) {
  try {
    const existing = await adminAuth().getUserByEmail(email);
    await adminAuth().updateUser(existing.uid, { password: PASSWORD, emailVerified: true });
    return existing.uid;
  } catch {
    const created = await adminAuth().createUser({
      email,
      password: PASSWORD,
      emailVerified: true,
    });
    return created.uid;
  }
}

async function main() {
  const now = new Date().toISOString();
  const instrumentRef = adminDb().collection("assessmentInstruments").doc("hybrid-v1");
  await instrumentRef.set({
    version: "1.0.0",
    name: "Resona Hybrid v1",
    items: ASSESSMENT_ITEMS,
    createdAt: now,
  });

  const created: Record<string, string> = {};

  for (const u of likertUsers) {
    const uid = await upsertAuthUser(u.email);
    created[u.email] = uid;

    const responseList = Object.entries(u.answers).map(([itemId, value]) => ({ itemId, value }));
    const { traits, validity } = scoreResponses(responseList);
    const responses: Record<string, { value: number; answeredAt: string; latencyMs: number }> = {};
    for (const r of responseList) {
      responses[r.itemId] = {
        value: r.value,
        answeredAt: now,
        latencyMs: 1200 + Math.floor(Math.random() * 800),
      };
    }

    await adminDb()
      .collection("users")
      .doc(uid)
      .set({
        email: u.email,
        status: "active",
        country: "ZA",
        locale: "en-ZA",
        ageVerifiedAt: now,
        consentVersion: "2026-11-10",
        consentAt: now,
        createdAt: now,
        updatedAt: now,
        profile: {
          displayName: u.displayName,
          birthYear: u.birthYear,
          bio: u.bio,
          intent: u.intent,
          gender: u.gender,
          seeking: "everyone",
          city: u.city,
          radiusKm: 50,
          dealbreakers: {},
          photoUrl: null,
          discoveryReadyAt: now,
        },
      });

    await adminDb()
      .collection("assessmentSessions")
      .doc(`${uid}_complete`)
      .set({
        userId: uid,
        instrumentId: instrumentRef.id,
        status: "complete",
        startedAt: now,
        completedAt: now,
        validityScore: validity,
        traitVector: traits,
        responses,
      });
  }

  const thandi = created["thandi@resona.app"];
  const alex = created["you@resona.app"];
  await adminDb()
    .collection("likes")
    .doc(likeId(thandi, alex))
    .set({
      fromUserId: thandi,
      toUserId: alex,
      action: "like",
      createdAt: now,
    });

  console.log("Seeded Firebase demo users. Password for all:", PASSWORD);
  console.log("Primary: you@resona.app — Like Thandi to unlock a match.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
