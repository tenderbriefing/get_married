"use client";

import { useState, useTransition } from "react";
import { sendMessageAction, uploadMatchPhotoAction } from "@/app/actions";

type Msg = {
  id: string;
  body: string;
  senderId: string;
  createdAt: string;
};

export function ChatClient(props: {
  matchId: string;
  meId: string;
  otherName: string;
  myPhotoUrl?: string | null;
  theirPhotoUrl?: string | null;
  facets: string[];
  icebreakers: string[];
  initialMessages: Msg[];
}) {
  const [messages, setMessages] = useState(props.initialMessages);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [photoUrl, setPhotoUrl] = useState(props.myPhotoUrl);

  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      <div className="panel" style={{ padding: "1rem 1.2rem" }}>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
          {props.theirPhotoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={props.theirPhotoUrl}
              alt={props.otherName}
              width={64}
              height={64}
              style={{ objectFit: "cover", borderRadius: 4 }}
            />
          ) : (
            <div
              style={{
                width: 64,
                height: 64,
                background: "var(--bg2)",
                color: "var(--sand)",
                display: "grid",
                placeItems: "center",
                fontFamily: "var(--font-display)",
              }}
            >
              {props.otherName.slice(0, 1)}
            </div>
          )}
          <div>
            <h2 className="brand" style={{ margin: 0, fontSize: "1.6rem" }}>
              {props.otherName}
            </h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginTop: "0.4rem" }}>
              {props.facets.map((f) => (
                <span key={f} className="chip">
                  {f}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="panel" style={{ padding: "1rem", display: "grid", gap: "0.65rem", minHeight: 280 }}>
        {messages.map((m) => (
          <div
            key={m.id}
            className={m.senderId === props.meId ? "msg-mine" : "msg-theirs"}
            style={{
              maxWidth: "85%",
              padding: "0.7rem 0.9rem",
              whiteSpace: "pre-wrap",
              borderRadius: 2,
            }}
          >
            {m.body}
          </div>
        ))}
      </div>

      <div className="panel" style={{ padding: "1rem", display: "grid", gap: "0.65rem" }}>
        <p className="label" style={{ margin: 0 }}>
          Icebreakers
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.45rem" }}>
          {props.icebreakers.map((line) => (
            <button
              key={line}
              type="button"
              className="btn btn-ghost"
              style={{ padding: "0.45rem 0.7rem", fontSize: "0.85rem" }}
              disabled={pending}
              onClick={() => {
                const fd = new FormData();
                fd.set("matchId", props.matchId);
                fd.set("body", line);
                startTransition(async () => {
                  await sendMessageAction(fd);
                  setMessages((prev) => [
                    ...prev,
                    {
                      id: `local-${Date.now()}`,
                      body: line,
                      senderId: props.meId,
                      createdAt: new Date().toISOString(),
                    },
                  ]);
                });
              }}
            >
              Use prompt
            </button>
          ))}
        </div>
        <form
          style={{ display: "flex", gap: "0.55rem" }}
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            const fd = new FormData(e.currentTarget);
            const body = String(fd.get("body") || "");
            fd.set("matchId", props.matchId);
            startTransition(async () => {
              const res = await sendMessageAction(fd);
              if (res?.error) {
                setError(res.error);
                return;
              }
              setMessages((prev) => [
                ...prev,
                {
                  id: `local-${Date.now()}`,
                  body,
                  senderId: props.meId,
                  createdAt: new Date().toISOString(),
                },
              ]);
              e.currentTarget.reset();
            });
          }}
        >
          <input className="field" name="body" placeholder="Write a message…" required />
          <button className="btn btn-primary" type="submit" disabled={pending}>
            Send
          </button>
        </form>
        {error && <p style={{ color: "crimson", margin: 0 }}>{error}</p>}
      </div>

      <div className="panel" style={{ padding: "1rem", display: "grid", gap: "0.65rem" }}>
        <h3 className="brand" style={{ margin: 0 }}>
          Optional photo (post-match only)
        </h3>
        <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.9rem" }}>
          Photos never affect ranking. Share one only after you match.
        </p>
        {photoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl} alt="Your shared photo" width={120} height={120} style={{ objectFit: "cover" }} />
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            fd.set("matchId", props.matchId);
            startTransition(async () => {
              const res = await uploadMatchPhotoAction(fd);
              if (res && "photoUrl" in res && res.photoUrl) setPhotoUrl(res.photoUrl);
              if (res?.error) setError(res.error);
            });
          }}
          style={{ display: "flex", gap: "0.55rem", flexWrap: "wrap" }}
        >
          <input type="file" name="photo" accept="image/*" required />
          <button className="btn btn-dark" type="submit" disabled={pending}>
            Upload photo
          </button>
        </form>
      </div>
    </div>
  );
}
