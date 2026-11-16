"use client";

import { useState, useTransition } from "react";
import { profileAction } from "@/app/actions";

export function ProfileForm(props: {
  displayName: string;
  bio: string;
  city: string;
  intent: string;
  ready: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="panel"
      style={{ padding: "1.5rem", display: "grid", gap: "0.9rem" }}
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
          const res = await profileAction(fd);
          if (res?.error) setError(res.error);
        });
      }}
    >
      <label>
        <span className="label">Display name</span>
        <input className="field" name="displayName" defaultValue={props.displayName} required />
      </label>
      <label>
        <span className="label">Short bio</span>
        <textarea className="field" name="bio" rows={4} defaultValue={props.bio} />
      </label>
      <label>
        <span className="label">City</span>
        <input className="field" name="city" defaultValue={props.city} />
      </label>
      <label>
        <span className="label">Intent</span>
        <select className="field" name="intent" defaultValue={props.intent}>
          <option value="dating">Dating</option>
          <option value="friendship">Friendship</option>
          <option value="either">Either</option>
        </select>
      </label>
      {error && <p style={{ color: "crimson", margin: 0 }}>{error}</p>}
      <button className="btn btn-primary" type="submit" disabled={pending}>
        {props.ready ? "Save & return to discovery" : "Enter discovery"}
      </button>
    </form>
  );
}
