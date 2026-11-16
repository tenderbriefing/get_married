import { redirect } from "next/navigation";
import { AppNav } from "@/components/AppNav";
import { DiscoverClient } from "@/components/DiscoverClient";
import { onboardingPath, requireUser } from "@/lib/auth";
import { getRankedDiscovery } from "@/lib/discovery";

export default async function DiscoverPage() {
  const user = await requireUser();
  const gate = onboardingPath(user);
  if (gate) redirect(gate);

  const cards = await getRankedDiscovery(user.id);

  return (
    <main>
      <AppNav email={user.email} />
      <div className="shell" style={{ padding: "1.5rem 0 4rem", maxWidth: 720 }}>
        <h1 className="brand" style={{ fontSize: "2.2rem", marginBottom: "0.25rem" }}>
          Discover
        </h1>
        <p style={{ color: "var(--muted)", marginTop: 0 }}>
          Ranked by psychometric fit. Photos never appear here.
        </p>
        <DiscoverClient initial={cards} />
      </div>
    </main>
  );
}
