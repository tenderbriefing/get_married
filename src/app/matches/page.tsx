import Link from "next/link";
import { redirect } from "next/navigation";
import { AppNav } from "@/components/AppNav";
import { onboardingPath, requireUser } from "@/lib/auth";
import { adminDb } from "@/lib/firebase/admin";
import { getUserDoc } from "@/lib/firebase/users";
import type { MatchDoc, MessageDoc } from "@/lib/firebase/types";
import { scoreBand } from "@/lib/matching";

export default async function MatchesPage() {
  const user = await requireUser();
  const gate = onboardingPath(user);
  if (gate) redirect(gate);

  const snap = await adminDb().collection("matches").get();
  const mine = snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as MatchDoc) }))
    .filter((m) => m.userAId === user.id || m.userBId === user.id)
    .sort((a, b) => String(b.matchedAt).localeCompare(String(a.matchedAt)));

  const rows = await Promise.all(
    mine.map(async (m) => {
      const otherId = m.userAId === user.id ? m.userBId : m.userAId;
      const other = await getUserDoc(otherId);
      const messages = await adminDb()
        .collection("matches")
        .doc(m.id)
        .collection("messages")
        .orderBy("createdAt", "desc")
        .limit(1)
        .get();
      const last = messages.docs[0]?.data() as MessageDoc | undefined;
      return { match: m, other, last };
    }),
  );

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
          {rows.length === 0 && (
            <div className="panel" style={{ padding: "1.5rem" }}>
              No matches yet. Like Thandi in Discover for a demo mutual match.
            </div>
          )}
          {rows.map(({ match: m, other, last }) => (
            <Link
              key={m.id}
              href={`/matches/${m.id}`}
              className="panel"
              style={{ padding: "1.15rem 1.25rem", display: "block" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
                <strong className="brand" style={{ fontSize: "1.25rem" }}>
                  {other?.profile?.displayName ?? "Match"}
                </strong>
                <span className="chip">{scoreBand(m.score)}</span>
              </div>
              <p style={{ margin: "0.45rem 0 0", color: "var(--muted)" }}>
                {last?.body?.slice(0, 120) || "Say hello"}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
