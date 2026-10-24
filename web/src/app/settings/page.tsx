"use client";

import { IdentitySection } from "@/components/settings/identity-section";
import { PasswordForm } from "@/components/settings/password-form";
import { StatusCard } from "@/components/settings/status-card";
import { ProfileForm } from "@/components/settings/profile-form";
import { useMe } from "@/lib/session";

export default function ProfileSettingsPage() {
  const { data: user } = useMe();
  if (!user) return null;
  return (
    <div className="grid items-start gap-8 lg:grid-cols-2">
      <section aria-labelledby="profile-heading">
        <h2
          id="profile-heading"
          className="mb-3 font-display text-xl font-semibold tracking-tight text-foreground"
        >
          Profile
        </h2>
        <ProfileForm key={user.id} user={user} />
      </section>
      <div className="space-y-8">
        <StatusCard key={user.id} user={user} />
        <IdentitySection user={user} />
        <section aria-labelledby="password-heading">
          <h2
            id="password-heading"
            className="mb-3 font-display text-xl font-semibold tracking-tight text-foreground"
          >
            Password
          </h2>
          <PasswordForm />
        </section>
      </div>
    </div>
  );
}
