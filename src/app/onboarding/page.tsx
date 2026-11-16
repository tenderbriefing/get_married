"use client";

import { useState, useTransition } from "react";
import { AppNav } from "@/components/AppNav";
import { onboardingAction } from "@/app/actions";

export default function OnboardingPage() {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <main>
      <AppNav compact />
      <div className="shell" style={{ padding: "2rem 0 4rem", maxWidth: 640 }}>
        <h1 className="brand" style={{ fontSize: "2.3rem" }}>Intent & consent</h1>
        <p style={{ color: "var(--muted)" }}>
          Tell us what you&apos;re here for. Scores are for matching — not clinical diagnosis.
        </p>
        <form
          className="panel"
          style={{ padding: "1.5rem", display: "grid", gap: "1rem" }}
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            const fd = new FormData(e.currentTarget);
            startTransition(async () => {
              const res = await onboardingAction(fd);
              if (res?.error) setError(res.error);
            });
          }}
        >
          <fieldset style={{ border: "none", padding: 0, margin: 0 }}>
            <legend className="label">I&apos;m looking for</legend>
            <div style={{ display: "grid", gap: "0.55rem" }}>
              {[
                ["dating", "Dating"],
                ["friendship", "Friendship"],
                ["either", "Either / both"],
              ].map(([value, label]) => (
                <label key={value} style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
                  <input type="radio" name="intent" value={value} defaultChecked={value === "either"} />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>
          <label style={{ display: "flex", gap: "0.7rem", alignItems: "flex-start" }}>
            <input type="checkbox" name="consent" style={{ marginTop: "0.3rem" }} />
            <span>
              I understand Resona measures how I think and relate to rank compatibility. Photos are optional
              only after a mutual match and never used for ranking. I am 18+.
            </span>
          </label>
          {error && <p style={{ color: "crimson", margin: 0 }}>{error}</p>}
          <button className="btn btn-primary" type="submit" disabled={pending}>
            Continue to assessment
          </button>
        </form>
      </div>
    </main>
  );
}
