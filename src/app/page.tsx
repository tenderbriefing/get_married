import Link from "next/link";
import { AppNav } from "@/components/AppNav";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (user?.profile?.discoveryReadyAt) redirect("/discover");

  return (
    <main>
      <AppNav email={user?.email} />
      <section className="shell hero-stage">
        <div style={{ color: "var(--cream)", maxWidth: "38rem", paddingBottom: "1rem" }}>
          <p className="rise" style={{ letterSpacing: "0.14em", textTransform: "uppercase", fontSize: "0.8rem", opacity: 0.85 }}>
            South Africa · Dating & friendship
          </p>
          <h1 className="brand rise" style={{ fontSize: "clamp(3rem, 10vw, 5.4rem)", lineHeight: 0.95, margin: "0.4rem 0 1rem" }}>
            Resona
          </h1>
          <p className="rise-delay" style={{ fontSize: "1.25rem", lineHeight: 1.5, maxWidth: "28rem", opacity: 0.92 }}>
            Match on how you think, relate, and decide — not how you look. Photos stay private until both of you like.
          </p>
          <div className="rise-delay" style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginTop: "1.75rem" }}>
            <Link href="/signup" className="btn btn-primary">
              Start matching
            </Link>
            <Link href="/login" className="btn btn-ghost" style={{ color: "var(--cream)", borderColor: "rgba(244,239,230,0.35)" }}>
              Log in
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
