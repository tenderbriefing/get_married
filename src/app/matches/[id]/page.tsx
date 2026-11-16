import { notFound, redirect } from "next/navigation";
import { AppNav } from "@/components/AppNav";
import { ChatClient } from "@/components/ChatClient";
import { onboardingPath, requireUser } from "@/lib/auth";
import { icebreakers, type Facet } from "@/lib/matching";
import { adminDb } from "@/lib/firebase/admin";
import { getUserDoc } from "@/lib/firebase/users";
import type { MatchDoc, MessageDoc } from "@/lib/firebase/types";

export default async function MatchChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const gate = onboardingPath(user);
  if (gate) redirect(gate);

  const matchSnap = await adminDb().collection("matches").doc(id).get();
  if (!matchSnap.exists) notFound();
  const match = { id: matchSnap.id, ...(matchSnap.data() as MatchDoc) };
  if (match.userAId !== user.id && match.userBId !== user.id) notFound();

  const otherId = match.userAId === user.id ? match.userBId : match.userAId;
  const other = await getUserDoc(otherId);
  const facets = (match.facets || []) as Facet[];
  const prompts = icebreakers(facets, other?.profile?.displayName || "there");

  const messagesSnap = await adminDb()
    .collection("matches")
    .doc(id)
    .collection("messages")
    .orderBy("createdAt", "asc")
    .get();

  return (
    <main>
      <AppNav email={user.email} />
      <div className="shell" style={{ padding: "1.5rem 0 4rem", maxWidth: 720 }}>
        <ChatClient
          matchId={match.id}
          meId={user.id}
          otherName={other?.profile?.displayName || "Match"}
          myPhotoUrl={user.profile?.photoUrl}
          theirPhotoUrl={other?.profile?.photoUrl}
          facets={facets.map((f) => f.label)}
          icebreakers={prompts}
          initialMessages={messagesSnap.docs.map((d) => {
            const m = d.data() as MessageDoc;
            return {
              id: d.id,
              body: m.body,
              senderId: m.senderId,
              createdAt: m.createdAt,
            };
          })}
        />
      </div>
    </main>
  );
}
