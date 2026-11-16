import type { TraitVector } from "./assessment-items";

export type Facet = { label: string; kind: "similar" | "complement" | "preference" };

const SIMILARITY_TRAITS = [
  "valuesOverlap" as const,
  "conscientiousness",
  "ambition",
  "familyOrientation",
  "adventure",
  "agreeableness",
  "directCommunication",
];

function sim(a: number, b: number): number {
  return 1 - Math.min(1, Math.abs(a - b) / 4);
}

export function compatibilityScore(
  a: TraitVector,
  b: TraitVector,
  validityA = 1,
  validityB = 1,
): { score: number; band: string; facets: Facet[] } {
  const weights: Record<string, number> = {
    conscientiousness: 0.12,
    ambition: 0.1,
    familyOrientation: 0.14,
    adventure: 0.1,
    agreeableness: 0.1,
    directCommunication: 0.1,
    repairOrientation: 0.1,
    openness: 0.08,
    socialEnergy: 0.08,
    emotionalStability: 0.08,
  };

  let weighted = 0;
  let totalW = 0;
  const facetCandidates: { facet: Facet; strength: number }[] = [];

  for (const [trait, w] of Object.entries(weights)) {
    const s = sim(a[trait] ?? 3, b[trait] ?? 3);
    weighted += s * w;
    totalW += w;
    if (s >= 0.75) {
      facetCandidates.push({
        strength: s,
        facet: {
          label: facetLabel(trait, "similar"),
          kind: "similar",
        },
      });
    }
  }

  // Complementarity: extraversion difference of ~1–2 points can be good
  const extDiff = Math.abs((a.extraversion ?? 3) - (b.extraversion ?? 3));
  const extComp = extDiff >= 0.8 && extDiff <= 2.2 ? 0.85 : sim(a.extraversion ?? 3, b.extraversion ?? 3);
  weighted += extComp * 0.08;
  totalW += 0.08;
  if (extDiff >= 0.8 && extDiff <= 2.2) {
    facetCandidates.push({
      strength: extComp,
      facet: { label: "Complementary social energy", kind: "complement" },
    });
  }

  // Attachment: lower mutual anxiety/avoidance is better; similar mid levels ok
  const attachPenalty =
    (((a.attachmentAnxiety ?? 3) + (b.attachmentAnxiety ?? 3)) / 10) * 0.05 +
    (((a.attachmentAvoidance ?? 3) + (b.attachmentAvoidance ?? 3)) / 10) * 0.05;

  let score = totalW === 0 ? 0.5 : weighted / totalW;
  score = Math.max(0, Math.min(1, score - attachPenalty));
  const validityPenalty = (2 - (validityA + validityB)) * 0.08;
  score = Math.max(0.15, Math.min(0.99, score - validityPenalty));

  // Shared values proxy from family + ambition + adventure
  const valuesSim =
    (sim(a.familyOrientation ?? 3, b.familyOrientation ?? 3) +
      sim(a.ambition ?? 3, b.ambition ?? 3) +
      sim(a.adventure ?? 3, b.adventure ?? 3)) /
    3;
  if (valuesSim >= 0.7) {
    facetCandidates.push({
      strength: valuesSim,
      facet: { label: "High values overlap", kind: "similar" },
    });
  }

  facetCandidates.sort((x, y) => y.strength - x.strength);
  const facets = facetCandidates.slice(0, 3).map((f) => f.facet);
  if (facets.length === 0) {
    facets.push({ label: "Compatible foundations", kind: "similar" });
  }

  void SIMILARITY_TRAITS;

  return { score, band: scoreBand(score), facets };
}

function facetLabel(trait: string, _kind: string): string {
  const map: Record<string, string> = {
    conscientiousness: "Similar follow-through",
    ambition: "Aligned ambition",
    familyOrientation: "Similar family outlook",
    adventure: "Shared adventure appetite",
    agreeableness: "Warm communication style",
    directCommunication: "Direct communication match",
    repairOrientation: "Similar repair style",
    openness: "Shared curiosity",
    socialEnergy: "Similar social energy",
    emotionalStability: "Steady emotional tone",
  };
  return map[trait] ?? "Compatible trait";
}

export function scoreBand(score: number): string {
  if (score >= 0.82) return "Excellent";
  if (score >= 0.68) return "Strong";
  if (score >= 0.55) return "Good";
  return "Fair";
}

export function icebreakers(facets: Facet[], name: string): string[] {
  const lines = [
    `Hey ${name} — Resona flagged us as a strong fit. What's one thing that usually makes a first chat click for you?`,
  ];
  for (const f of facets.slice(0, 2)) {
    if (f.label.toLowerCase().includes("family")) {
      lines.push("Curious — how do you usually talk about the future with people you're getting to know?");
    } else if (f.label.toLowerCase().includes("adventure")) {
      lines.push("Weekend vote: spontaneous plan or a solid routine — which wins for you?");
    } else if (f.label.toLowerCase().includes("communication") || f.label.toLowerCase().includes("direct")) {
      lines.push("I'm big on clear conversations — what's a topic you never mind going deep on?");
    } else if (f.label.toLowerCase().includes("social") || f.label.toLowerCase().includes("energy")) {
      lines.push("Cape Town energy check: favourite low-key spot vs favourite lively one?");
    } else {
      lines.push(`We scored high on “${f.label.toLowerCase()}” — what's a real-life example of that for you?`);
    }
  }
  return Array.from(new Set(lines)).slice(0, 3);
}
