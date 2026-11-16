"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { ASSESSMENT_ITEMS, LIKERT_LABELS } from "@/lib/assessment-items";
import { saveAssessmentAnswerAction } from "@/app/actions";

export function AssessmentForm({ answeredIds }: { answeredIds: string[] }) {
  const answered = useMemo(() => new Set(answeredIds), [answeredIds]);
  const nextIndex = ASSESSMENT_ITEMS.findIndex((i) => !answered.has(i.id));
  const [index, setIndex] = useState(nextIndex === -1 ? 0 : nextIndex);
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setStartedAt(Date.now());
  }, [index]);

  const item = ASSESSMENT_ITEMS[index];
  const progress = Math.round((answered.size / ASSESSMENT_ITEMS.length) * 100);

  if (!item) {
    return <p>Assessment complete. Redirecting…</p>;
  }

  function answer(value: number) {
    setError(null);
    const fd = new FormData();
    fd.set("itemId", item.id);
    fd.set("value", String(value));
    fd.set("latencyMs", String(Date.now() - startedAt));
    startTransition(async () => {
      const res = await saveAssessmentAnswerAction(fd);
      if (res && "error" in res && res.error) {
        setError(res.error);
        return;
      }
      const next = ASSESSMENT_ITEMS.findIndex(
        (i, idx) => idx > index && !answered.has(i.id) && i.id !== item.id,
      );
      const fallback = ASSESSMENT_ITEMS.findIndex((i) => !answered.has(i.id) && i.id !== item.id);
      setIndex(next === -1 ? (fallback === -1 ? index : fallback) : next);
    });
  }

  return (
    <div className="panel rise" style={{ padding: "1.5rem" }}>
      <div className="progress" style={{ marginBottom: "1.25rem" }}>
        <span style={{ width: `${progress}%` }} />
      </div>
      <p style={{ color: "var(--muted)", marginTop: 0 }}>
        Question {Math.min(answered.size + 1, ASSESSMENT_ITEMS.length)} of {ASSESSMENT_ITEMS.length}
      </p>
      <h2 className="brand" style={{ fontSize: "1.7rem", lineHeight: 1.25, marginTop: "0.25rem" }}>
        {item.text}
      </h2>
      <div style={{ display: "grid", gap: "0.6rem", marginTop: "1.5rem" }}>
        {LIKERT_LABELS.map((label, i) => (
          <button
            key={label}
            type="button"
            className="btn btn-ghost"
            disabled={pending}
            onClick={() => answer(i + 1)}
            style={{ justifyContent: "flex-start" }}
          >
            {label}
          </button>
        ))}
      </div>
      {error && <p style={{ color: "crimson" }}>{error}</p>}
      <p style={{ color: "var(--muted)", fontSize: "0.85rem", marginBottom: 0 }}>
        For matching, not a clinical diagnosis. You can pause anytime — progress is saved.
      </p>
    </div>
  );
}
