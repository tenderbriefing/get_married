import { NextResponse } from "next/server";
import { getCurrentUser, onboardingPath } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ redirect: "/login" });
  const gate = onboardingPath(user);
  if (gate && gate !== "/profile") return NextResponse.json({ redirect: gate });

  return NextResponse.json({
    email: user.email,
    displayName: user.profile?.displayName ?? "",
    bio: user.profile?.bio ?? "",
    city: user.profile?.city ?? "Cape Town",
    intent: user.profile?.intent ?? "either",
    ready: Boolean(user.profile?.discoveryReadyAt),
  });
}
