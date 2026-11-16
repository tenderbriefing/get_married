import { redirect } from "next/navigation";
import { AppNav } from "@/components/AppNav";
import { AssessmentForm } from "@/components/AssessmentForm";
import { requireUser } from "@/lib/auth";
import { getInProgressAssessment, getLatestCompleteAssessment } from "@/lib/firebase/users";

export default async function AssessmentPage() {
  const user = await requireUser();
  if (!user.consentAt) redirect("/onboarding");

  const complete = await getLatestCompleteAssessment(user.id);
  if (complete && user.profile?.discoveryReadyAt) redirect("/discover");
  if (complete) redirect("/profile");

  const session = await getInProgressAssessment(user.id);

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
        <AssessmentForm answeredIds={Object.keys(session?.responses || {})} />
      </div>
    </main>
  );
}
