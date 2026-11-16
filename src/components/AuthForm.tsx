"use client";

import { useState, useTransition } from "react";

type Action = (formData: FormData) => Promise<{ error?: string; ok?: boolean; message?: string } | void>;

export function AuthForm({
  action,
  submitLabel,
  children,
  onSuccessRedirect,
}: {
  action: Action;
  submitLabel: string;
  children: React.ReactNode;
  onSuccessRedirect?: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        setMessage(null);
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
          const res = await action(fd);
          if (res && "error" in res && res.error) {
            setError(res.error);
            return;
          }
          if (res && "message" in res && res.message) {
            setMessage(res.message);
            if (onSuccessRedirect) window.location.href = onSuccessRedirect;
          }
        });
      }}
      style={{ display: "grid", gap: "0.9rem" }}
    >
      {children}
      {error && <p style={{ color: "crimson", margin: 0 }}>{error}</p>}
      {message && <p style={{ color: "var(--good)", margin: 0 }}>{message}</p>}
      <button className="btn btn-primary" type="submit" disabled={pending}>
        {pending ? "Working…" : submitLabel}
      </button>
    </form>
  );
}
