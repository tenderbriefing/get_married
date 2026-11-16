import { notFound, redirect } from "next/navigation";
import { AppNav } from "@/components/AppNav";
import { ChatClient } from "@/components/ChatClient";
import { onboardingPath, requireUser } from "@/lib/auth";
import { icebreakers, type Facet } from "@/lib/matching";
import { prisma } from "@/lib/prisma";

export default async function MatchChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const gate = onboardingPath(user);
  if (gate) redirect(gate);

  const match = await prisma.match.findUnique({
    where: { id },
    include: {
      userA: { include: { profile: true } },
      userB: { include: { profile: true } },
      conversation: {
        include: { messages: { orderBy: { createdAt: "asc" } } },
      },
    },
  });

  if (!match || (match.userAId !== user.id && match.userBId !== user.id)) {
    notFound();
  }

  const other = match.userAId === user.id ? match.userB : match.userA;
  const facets = JSON.parse(match.facetsJson || "[]") as Facet[];
  const prompts = icebreakers(facets, other.profile?.displayName || "there");

  return (
    <main>
      <AppNav email={user.email} />
      <div className="shell" style={{ padding: "1.5rem 0 4rem", maxWidth: 720 }}>
        <ChatClient
          matchId={match.id}
          meId={user.id}
          otherName={other.profile?.displayName || "Match"}
          myPhotoUrl={user.profile?.photoUrl}
          theirPhotoUrl={other.profile?.photoUrl}
          facets={facets.map((f) => f.label)}
          icebreakers={prompts}
          initialMessages={(match.conversation?.messages || []).map((m) => ({
            id: m.id,
            body: m.body,
            senderId: m.senderId,
            createdAt: m.createdAt.toISOString(),
          }))}
        />
      </div>
    </main>
  );
}
