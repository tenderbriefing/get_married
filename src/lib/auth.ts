import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminAuth } from "./firebase/admin";
import { toAppUser } from "./firebase/users";
import type { AppUser } from "./firebase/types";

export type { AppUser };

const SESSION_COOKIE = "resona_session";
const SESSION_DAYS = 14;

export async function createSessionFromIdToken(idToken: string) {
  const expiresIn = SESSION_DAYS * 24 * 60 * 60 * 1000;
  const sessionCookie = await adminAuth().createSessionCookie(idToken, { expiresIn });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, sessionCookie, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
  return sessionCookie;
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  jar.delete(SESSION_COOKIE);
  if (!token) return;
  try {
    const decoded = await adminAuth().verifySessionCookie(token);
    await adminAuth().revokeRefreshTokens(decoded.sub);
  } catch {
    // ignore invalid/expired cookies on logout
  }
}

export async function getCurrentUser(): Promise<AppUser | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const decoded = await adminAuth().verifySessionCookie(token, true);
    return toAppUser(decoded.uid);
  } catch {
    return null;
  }
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export function onboardingPath(user: AppUser): string | null {
  if (!user.consentAt) return "/onboarding";
  const done = user.assessmentSessions[0];
  if (!done) return "/assessment";
  if (!user.profile?.discoveryReadyAt) return "/profile";
  return null;
}
