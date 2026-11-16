import Link from "next/link";
import { AppNav } from "@/components/AppNav";
import { AuthForm } from "@/components/AuthForm";
import { signupAction } from "@/app/actions";

export default function SignupPage() {
  return (
    <main>
      <AppNav />
      <div className="shell" style={{ padding: "2rem 0 4rem", maxWidth: 520 }}>
        <h1 className="brand" style={{ fontSize: "2.4rem" }}>Join Resona</h1>
        <p style={{ color: "var(--muted)" }}>18+ · South Africa first · Dating and friendship</p>
        <div className="panel" style={{ padding: "1.35rem", marginTop: "1.25rem" }}>
          <AuthForm action={signupAction} submitLabel="Create account">
            <label>
              <span className="label">Display name</span>
              <input className="field" name="displayName" required />
            </label>
            <label>
              <span className="label">Email</span>
              <input className="field" name="email" type="email" required />
            </label>
            <label>
              <span className="label">Password (min 6)</span>
              <input className="field" name="password" type="password" minLength={6} required />
            </label>
            <label>
              <span className="label">Birth year</span>
              <input className="field" name="birthYear" type="number" min={1950} max={2008} required />
            </label>
          </AuthForm>
        </div>
        <p style={{ marginTop: "1.25rem" }}>
          Already have an account? <Link href="/login">Log in</Link>
        </p>
      </div>
    </main>
  );
}
