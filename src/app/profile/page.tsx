import { redirect } from "next/navigation";
import { AppNav } from "@/components/AppNav";
import { ProfileForm } from "@/components/ProfileForm";
import { onboardingPath, requireUser } from "@/lib/auth";

export default async function ProfilePage() {
  const user = await requireUser();
  const gate = onboardingPath(user);
  if (gate && gate !== "/profile") redirect(gate);

  return (
    <main>
      <AppNav email={user.email} />
      <div className="shell" style={{ padding: "2rem 0 4rem", maxWidth: 640 }}>
        <h1 className="brand" style={{ fontSize: "2.2rem" }}>
          Profile polish
        </h1>
        <p style={{ color: "var(--muted)" }}>
          Text-only discovery card. No photo until a mutual match.
        </p>
        <ProfileForm
          displayName={user.profile?.displayName ?? ""}
          bio={user.profile?.bio ?? ""}
          city={user.profile?.city ?? "Cape Town"}
          intent={user.profile?.intent ?? "either"}
          ready={Boolean(user.profile?.discoveryReadyAt)}
        />
      </div>
    </main>
  );
}
