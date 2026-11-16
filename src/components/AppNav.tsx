import Link from "next/link";
import { logoutAction } from "@/app/actions";

export function AppNav({
  email,
  compact = false,
}: {
  email?: string | null;
  compact?: boolean;
}) {
  return (
    <header className="shell nav">
      <Link href={email ? "/discover" : "/"} className="brand" style={{ fontSize: "1.55rem" }}>
        Resona
      </Link>
      <nav className="nav-links">
        {email ? (
          <>
            {!compact && (
              <>
                <Link href="/discover">Discover</Link>
                <Link href="/matches">Matches</Link>
                <Link href="/profile">Profile</Link>
              </>
            )}
            <span style={{ color: "var(--muted)", fontSize: "0.85rem" }}>{email}</span>
            <form action={logoutAction}>
              <button className="btn btn-ghost" type="submit" style={{ padding: "0.45rem 0.8rem" }}>
                Log out
              </button>
            </form>
          </>
        ) : (
          <>
            <Link href="/login">Log in</Link>
            <Link href="/signup" className="btn btn-primary" style={{ padding: "0.55rem 1rem" }}>
              Sign up
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
