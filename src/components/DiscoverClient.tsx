"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { DiscoveryCard } from "@/lib/discovery";
import { swipeAction } from "@/app/actions";

export function DiscoverClient({ initial }: { initial: DiscoveryCard[] }) {
  const [cards, setCards] = useState(initial);
  const [toast, setToast] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const card = cards[0];

  function act(action: "like" | "pass") {
    if (!card) return;
    const fd = new FormData();
    fd.set("toUserId", card.userId);
    fd.set("action", action);
    startTransition(async () => {
      const res = await swipeAction(fd);
      setCards((prev) => prev.slice(1));
      if (res && "matchId" in res && res.matchId) {
        setToast(`Mutual match with ${card.displayName}! Opening chat…`);
        setTimeout(() => router.push(`/matches/${res.matchId}`), 700);
      }
    });
  }

  if (!card) {
    return (
      <div className="panel" style={{ padding: "2rem", textAlign: "center" }}>
        <h2 className="brand">You&apos;re caught up</h2>
        <p style={{ color: "var(--muted)" }}>
          No more ranked profiles right now. Check Matches or come back after more people join.
        </p>
      </div>
    );
  }

  return (
    <div>
      {toast && (
        <p className="rise" style={{ background: "var(--bg1)", color: "var(--sand)", padding: "0.85rem 1rem" }}>
          {toast}
        </p>
      )}
      <article
        className="panel rise"
        style={{ padding: "1.75rem", marginTop: toast ? "1rem" : 0 }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
          <div>
            <p style={{ margin: 0, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", fontSize: "0.75rem" }}>
              Ranked by compatibility · no photos
            </p>
            <h2 className="brand" style={{ fontSize: "2.2rem", margin: "0.35rem 0" }}>
              {card.displayName}, {card.age}
            </h2>
            <p style={{ margin: 0, color: "var(--muted)" }}>
              {card.city} · {card.intent}
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <div className="chip" style={{ fontSize: "1rem", padding: "0.5rem 0.85rem" }}>
              {card.band}
            </div>
            <p style={{ margin: "0.4rem 0 0", color: "var(--muted)", fontSize: "0.85rem" }}>
              Score band only — not a raw ranking feed
            </p>
          </div>
        </div>
        <p style={{ fontSize: "1.1rem", lineHeight: 1.55, marginTop: "1.25rem" }}>{card.bio}</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "1rem" }}>
          {card.facets.map((f) => (
            <span key={f.label} className="chip">
              {f.label}
            </span>
          ))}
        </div>
        <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.75rem" }}>
          <button className="btn btn-pass" type="button" disabled={pending} onClick={() => act("pass")} style={{ flex: 1 }}>
            Pass
          </button>
          <button className="btn btn-like" type="button" disabled={pending} onClick={() => act("like")} style={{ flex: 1 }}>
            Like
          </button>
        </div>
      </article>
    </div>
  );
}
