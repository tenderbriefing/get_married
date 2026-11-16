import { redirect } from "next/navigation";
import { AppNav } from "@/components/AppNav";
import { AssessmentForm } from "@/components/AssessmentForm";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AssessmentPage() {
  const user = await requireUser();
  if (!user.consentAt) redirect("/onboarding");

  const complete = await prisma.assessmentSession.findFirst({
    where: { userId: user.id, status: "complete" },
  });
  if (complete && user.profile?.discoveryReadyAt) redirect("/discover");
  if (complete) redirect("/profile");

  const session = await prisma.assessmentSession.findFirst({
    where: { userId: user.id, status: "in_progress" },
    include: { responses: true },
    orderBy: { startedAt: "desc" },
  });

  return (
    <main>
      <AppNav email={user.email} compact />
      <div className="shell" style={{ padding: "1.5rem 0 4rem", maxWidth: 640 }}>
        <h1 className="brand" style={{ fontSize: "2.2rem", marginBottom: "0.35rem" }}>
          Hybrid assessment
        </h1>
        <p style={{ color: "var(--muted)", marginTop: 0 }}>
          About 8–12 minutes. Big Five constructs plus relationship, values, and communication items.
        </p>
        <AssessmentForm answeredIds={session?.responses.map((r) => r.itemId) ?? []} />
      </div>
    </main>
  );
}
