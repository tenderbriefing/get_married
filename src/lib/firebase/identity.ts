import { getFirebaseWebConfig } from "./config";

type AuthResponse = {
  idToken: string;
  refreshToken: string;
  localId: string;
  email?: string;
  expiresIn?: string;
};

type AuthError = {
  error?: { message?: string };
};

async function postIdentity<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const config = getFirebaseWebConfig();
  if (!config) throw new Error("Firebase web config missing");
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/${path}?key=${config.apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
  const data = (await res.json()) as T & AuthError;
  if (!res.ok) {
    const msg = data.error?.message || `Auth request failed (${res.status})`;
    throw new Error(msg);
  }
  return data;
}

export async function signUpEmailPassword(email: string, password: string) {
  return postIdentity<AuthResponse>("accounts:signUp", {
    email,
    password,
    returnSecureToken: true,
  });
}

export async function signInEmailPassword(email: string, password: string) {
  return postIdentity<AuthResponse>("accounts:signInWithPassword", {
    email,
    password,
    returnSecureToken: true,
  });
}

export async function exchangeCustomToken(token: string) {
  return postIdentity<AuthResponse>("accounts:signInWithCustomToken", {
    token,
    returnSecureToken: true,
  });
}

export function friendlyAuthError(err: unknown) {
  const raw = err instanceof Error ? err.message : String(err);
  if (raw.includes("EMAIL_EXISTS")) return "An account with that email already exists.";
  if (raw.includes("EMAIL_NOT_FOUND") || raw.includes("INVALID_PASSWORD") || raw.includes("INVALID_LOGIN_CREDENTIALS")) {
    return "Invalid email or password.";
  }
  if (raw.includes("WEAK_PASSWORD")) return "Password should be at least 6 characters.";
  if (raw.includes("INVALID_EMAIL")) return "Check your details and try again.";
  return raw;
}
