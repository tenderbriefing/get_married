import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { ASSESSMENT_ITEMS, scoreResponses } from "../src/lib/assessment-items";

const prisma = new PrismaClient();

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

async function main() {
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.match.deleteMany();
  await prisma.swipe.deleteMany();
  await prisma.assessmentResponse.deleteMany();
  await prisma.assessmentSession.deleteMany();
  await prisma.blockReport.deleteMany();
  await prisma.session.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.assessmentInstrument.deleteMany();

  const instrument = await prisma.assessmentInstrument.create({
    data: {
      version: "1.0.0",
      name: "Resona Hybrid v1",
      itemsJson: JSON.stringify(ASSESSMENT_ITEMS),
    },
  });

  const passwordHash = await bcrypt.hash("demo1234", 10);
  const created: Record<string, string> = {};

  for (const u of likertUsers) {
    const user = await prisma.user.create({
      data: {
        email: u.email,
        passwordHash,
        country: "ZA",
        locale: "en-ZA",
        ageVerifiedAt: new Date(),
        consentVersion: "2026-11-10",
        consentAt: new Date(),
        profile: {
          create: {
            displayName: u.displayName,
            birthYear: u.birthYear,
            bio: u.bio,
            intent: u.intent,
            gender: u.gender,
            seeking: "everyone",
            city: u.city,
            discoveryReadyAt: new Date(),
          },
        },
      },
    });
    created[u.email] = user.id;

    const responseList = Object.entries(u.answers).map(([itemId, value]) => ({
      itemId,
      value,
    }));
    const { traits, validity } = scoreResponses(responseList);

    const session = await prisma.assessmentSession.create({
      data: {
        userId: user.id,
        instrumentId: instrument.id,
        status: "complete",
        completedAt: new Date(),
        validityScore: validity,
        traitVectorJson: JSON.stringify(traits),
      },
    });

    for (const r of responseList) {
      await prisma.assessmentResponse.create({
        data: {
          sessionId: session.id,
          itemId: r.itemId,
          value: r.value,
          latencyMs: 1200 + Math.floor(Math.random() * 800),
        },
      });
    }
  }

  // Thandi already Liked Alex — Like Thandi in Discover for mutual match
  await prisma.swipe.create({
    data: {
      fromUserId: created["thandi@resona.app"],
      toUserId: created["you@resona.app"],
      action: "like",
    },
  });

  console.log("Seeded Resona demo users. Password for all: demo1234");
  console.log("Primary: you@resona.app — Like Thandi to unlock a match.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
