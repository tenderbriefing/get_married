export type AssessmentItem = {
  id: string;
  text: string;
  trait: string;
  reverse?: boolean;
  kind: "likert" | "attention";
};

/** Hybrid instrument: Big Five short + attachment/values/conflict/lifestyle. */
export const ASSESSMENT_ITEMS: AssessmentItem[] = [
  // Big Five — Openness
  { id: "o1", text: "I enjoy exploring new ideas and perspectives.", trait: "openness", kind: "likert" },
  { id: "o2", text: "I prefer familiar routines over trying something new.", trait: "openness", reverse: true, kind: "likert" },
  { id: "o3", text: "Art, music, or nature often moves me deeply.", trait: "openness", kind: "likert" },
  // Conscientiousness
  { id: "c1", text: "I follow through on plans I make.", trait: "conscientiousness", kind: "likert" },
  { id: "c2", text: "I often leave tasks until the last minute.", trait: "conscientiousness", reverse: true, kind: "likert" },
  { id: "c3", text: "Keeping my space and calendar organised matters to me.", trait: "conscientiousness", kind: "likert" },
  // Extraversion
  { id: "e1", text: "I feel energised after spending time with people.", trait: "extraversion", kind: "likert" },
  { id: "e2", text: "I prefer quiet evenings over busy social plans.", trait: "extraversion", reverse: true, kind: "likert" },
  { id: "e3", text: "I find it easy to start conversations with new people.", trait: "extraversion", kind: "likert" },
  // Agreeableness
  { id: "a1", text: "I try to see conflicts from the other person's side.", trait: "agreeableness", kind: "likert" },
  { id: "a2", text: "Winning an argument matters more than keeping the peace.", trait: "agreeableness", reverse: true, kind: "likert" },
  { id: "a3", text: "People usually describe me as warm and supportive.", trait: "agreeableness", kind: "likert" },
  // Emotional stability (reverse neuroticism)
  { id: "n1", text: "I stay calm under pressure most of the time.", trait: "emotionalStability", kind: "likert" },
  { id: "n2", text: "I worry a lot about things that might go wrong.", trait: "emotionalStability", reverse: true, kind: "likert" },
  { id: "n3", text: "My moods can shift quickly from day to day.", trait: "emotionalStability", reverse: true, kind: "likert" },
  // Attachment — anxiety
  { id: "att1", text: "I often worry that people I care about will pull away.", trait: "attachmentAnxiety", kind: "likert" },
  { id: "att2", text: "I need frequent reassurance in close relationships.", trait: "attachmentAnxiety", kind: "likert" },
  // Attachment — avoidance
  { id: "att3", text: "I prefer to keep my feelings private, even with partners.", trait: "attachmentAvoidance", kind: "likert" },
  { id: "att4", text: "Getting too close to someone makes me uncomfortable.", trait: "attachmentAvoidance", kind: "likert" },
  // Values & lifestyle
  { id: "v1", text: "Ambition and career growth are central to my life right now.", trait: "ambition", kind: "likert" },
  { id: "v2", text: "I value ease and balance more than climbing a ladder.", trait: "ambition", reverse: true, kind: "likert" },
  { id: "v3", text: "Adventure and novelty matter more to me than predictability.", trait: "adventure", kind: "likert" },
  { id: "v4", text: "I like a steady, predictable week.", trait: "adventure", reverse: true, kind: "likert" },
  { id: "v5", text: "Having children (now or someday) is important to me.", trait: "familyOrientation", kind: "likert" },
  { id: "v6", text: "I want a partner/friend who shares my views on family.", trait: "familyOrientation", kind: "likert" },
  // Conflict & communication
  { id: "cf1", text: "When something bothers me, I bring it up directly.", trait: "directCommunication", kind: "likert" },
  { id: "cf2", text: "I tend to avoid hard conversations hoping they pass.", trait: "directCommunication", reverse: true, kind: "likert" },
  { id: "cf3", text: "After a disagreement, I actively try to repair the connection.", trait: "repairOrientation", kind: "likert" },
  { id: "cf4", text: "I need space after conflict before I can talk.", trait: "repairOrientation", reverse: true, kind: "likert" },
  // Social energy / lifestyle
  { id: "s1", text: "Weekends with friends recharge me more than alone time.", trait: "socialEnergy", kind: "likert" },
  { id: "s2", text: "I protect alone time carefully.", trait: "socialEnergy", reverse: true, kind: "likert" },
  // Attention checks
  { id: "attn1", text: "To show you're paying attention, select Agree for this item.", trait: "attention", kind: "attention" },
  { id: "attn2", text: "Select Strongly Disagree for this attention check.", trait: "attention", kind: "attention" },
];

export const LIKERT_LABELS = [
  "Strongly disagree",
  "Disagree",
  "Neutral",
  "Agree",
  "Strongly agree",
] as const;

export type TraitVector = Record<string, number>;

const TRAIT_KEYS = [
  "openness",
  "conscientiousness",
  "extraversion",
  "agreeableness",
  "emotionalStability",
  "attachmentAnxiety",
  "attachmentAvoidance",
  "ambition",
  "adventure",
  "familyOrientation",
  "directCommunication",
  "repairOrientation",
  "socialEnergy",
] as const;

export function scoreResponses(
  responses: { itemId: string; value: number }[],
): { traits: TraitVector; validity: number } {
  const byId = new Map(responses.map((r) => [r.itemId, r.value]));
  const buckets: Record<string, number[]> = {};

  for (const item of ASSESSMENT_ITEMS) {
    if (item.kind === "attention") continue;
    const raw = byId.get(item.id);
    if (raw == null) continue;
    const scored = item.reverse ? 6 - raw : raw;
    if (!buckets[item.trait]) buckets[item.trait] = [];
    buckets[item.trait].push(scored);
  }

  const traits: TraitVector = {};
  for (const key of TRAIT_KEYS) {
    const vals = buckets[key] ?? [];
    traits[key] =
      vals.length === 0
        ? 3
        : vals.reduce((a, b) => a + b, 0) / vals.length;
  }

  let validity = 1;
  const attn1 = byId.get("attn1");
  const attn2 = byId.get("attn2");
  if (attn1 != null && attn1 < 4) validity -= 0.35;
  if (attn2 != null && attn2 > 2) validity -= 0.35;
  validity = Math.max(0.2, validity);

  return { traits, validity };
}
