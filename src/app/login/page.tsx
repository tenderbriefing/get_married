import Link from "next/link";
import { AppNav } from "@/components/AppNav";
import { AuthForm } from "@/components/AuthForm";
import { loginAction, magicLinkStubAction } from "@/app/actions";

export default function LoginPage() {
  return (
    <main>
      <AppNav />
      <div className="shell" style={{ padding: "2rem 0 4rem", maxWidth: 520 }}>
        <h1 className="brand" style={{ fontSize: "2.4rem", marginBottom: "0.35rem" }}>
          Welcome back
        </h1>
        <p style={{ color: "var(--muted)", marginTop: 0 }}>
          Demo: <code>you@resona.app</code> / <code>demo1234</code>
        </p>
        <div className="panel" style={{ padding: "1.35rem", marginTop: "1.25rem" }}>
          <AuthForm action={loginAction} submitLabel="Log in">
            <label>
              <span className="label">Email</span>
              <input className="field" name="email" type="email" defaultValue="you@resona.app" required />
            </label>
            <label>
              <span className="label">Password</span>
              <input className="field" name="password" type="password" defaultValue="demo1234" required />
            </label>
          </AuthForm>
        </div>
        <div className="panel" style={{ padding: "1.35rem", marginTop: "1rem" }}>
          <p style={{ marginTop: 0, color: "var(--muted)" }}>Magic link stub (signs in immediately in demo)</p>
          <AuthForm action={magicLinkStubAction} submitLabel="Send magic link" onSuccessRedirect="/discover">
            <label>
              <span className="label">Email</span>
              <input className="field" name="email" type="email" placeholder="you@resona.app" required />
            </label>
          </AuthForm>
        </div>
        <p style={{ marginTop: "1.25rem" }}>
          New here? <Link href="/signup">Create an account</Link>
        </p>
      </div>
    </main>
  );
}
