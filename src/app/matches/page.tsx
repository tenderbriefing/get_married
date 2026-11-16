import Link from "next/link";
import { redirect } from "next/navigation";
import { AppNav } from "@/components/AppNav";
import { onboardingPath, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { scoreBand } from "@/lib/matching";

export default async function MatchesPage() {
  const user = await requireUser();
  const gate = onboardingPath(user);
  if (gate) redirect(gate);

  const matches = await prisma.match.findMany({
    where: { OR: [{ userAId: user.id }, { userBId: user.id }] },
    include: {
      userA: { include: { profile: true } },
      userB: { include: { profile: true } },
      conversation: {
        include: { messages: { orderBy: { createdAt: "desc" }, take: 1 } },
      },
    },
    orderBy: { matchedAt: "desc" },
  });

  return (
    <main>
      <AppNav email={user.email} />
      <div className="shell" style={{ padding: "1.5rem 0 4rem", maxWidth: 720 }}>
        <h1 className="brand" style={{ fontSize: "2.2rem" }}>
          Matches
        </h1>
        <p style={{ color: "var(--muted)" }}>
          Mutual likes unlock chat. Photos are optional after match.
        </p>
        <div style={{ display: "grid", gap: "0.85rem", marginTop: "1.25rem" }}>
          {matches.length === 0 && (
            <div className="panel" style={{ padding: "1.5rem" }}>
              No matches yet. Like Thandi in Discover for a demo mutual match.
            </div>
          )}
          {matches.map((m) => {
            const other = m.userAId === user.id ? m.userB : m.userA;
            const last = m.conversation?.messages[0];
            return (
              <Link
                key={m.id}
                href={`/matches/${m.id}`}
                className="panel"
                style={{ padding: "1.15rem 1.25rem", display: "block" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
                  <strong className="brand" style={{ fontSize: "1.25rem" }}>
                    {other.profile?.displayName ?? "Match"}
                  </strong>
                  <span className="chip">{scoreBand(m.score)}</span>
                </div>
                <p style={{ margin: "0.45rem 0 0", color: "var(--muted)" }}>
                  {last?.body?.slice(0, 120) || "Say hello"}
                </p>
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}
