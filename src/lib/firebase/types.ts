export type ProfileDoc = {
  displayName: string;
  birthYear: number;
  bio: string;
  intent: string;
  gender: string;
  seeking: string;
  city: string;
  radiusKm: number;
  dealbreakers: Record<string, unknown>;
  photoUrl: string | null;
  discoveryReadyAt: string | null;
};

export type UserDoc = {
  email: string;
  status: string;
  country: string;
  locale: string;
  ageVerifiedAt: string | null;
  consentVersion: string | null;
  consentAt: string | null;
  createdAt: string;
  updatedAt: string;
  profile: ProfileDoc | null;
};

export type AssessmentSessionDoc = {
  userId: string;
  instrumentId: string;
  status: "in_progress" | "complete" | "invalid";
  startedAt: string;
  completedAt: string | null;
  validityScore: number;
  traitVector: Record<string, number>;
  responses: Record<string, { value: number; answeredAt: string; latencyMs: number }>;
};

export type LikeDoc = {
  fromUserId: string;
  toUserId: string;
  action: "like" | "pass";
  createdAt: string;
};

export type MatchDoc = {
  userAId: string;
  userBId: string;
  score: number;
  facets: unknown[];
  matchedAt: string;
  photoUnlockedAt: string | null;
};

export type MessageDoc = {
  senderId: string;
  body: string;
  moderatedFlag: boolean;
  createdAt: string;
};

export type AppUserProfile = Omit<ProfileDoc, "discoveryReadyAt"> & {
  discoveryReadyAt: Date | null;
};

export type AppUser = {
  id: string;
  email: string;
  status: string;
  country: string;
  locale: string;
  ageVerifiedAt: Date | null;
  consentVersion: string | null;
  consentAt: Date | null;
  profile: AppUserProfile | null;
  assessmentSessions: Array<{
    id: string;
    status: string;
    completedAt: Date | null;
    validityScore: number;
    traitVectorJson: string;
  }>;
};
