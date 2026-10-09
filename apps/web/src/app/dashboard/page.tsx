"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { apiBaseUrl } from "@adda/shared";
import { Card } from "@/components/ui/card";
import { DashboardShell } from "@/components/dashboard-shell";
import { TextTabs } from "@/components/page-tabs";
import { ProfileCard } from "@/components/settings-profile-card";
import { PasswordCard } from "@/components/settings-password-card";
import { TwoFactorCard } from "@/components/settings-2fa-card";
import { DmView } from "@/components/dm-view";
import { StudioClient } from "@/components/studio-client";
import { useMe } from "@/lib/session";

const SETTINGS_TABS = [
  { id: "password", label: "Password" },
  { id: "security", label: "Security" },
  { id: "connection", label: "Connection" },
];

function Dashboard() {
  const { data: user } = useMe();
  const params = useSearchParams();
  const tab = params.get("tab") ?? "profile";
  const [settingsTab, setSettingsTab] = useState("password");

  return (
    <DashboardShell>
      {tab === "profile" && user && <ProfileCard user={user} />}
      {tab === "messages" && <DmView />}
      {tab === "studio" && <StudioClient />}
      {tab === "settings" && (
        <div className="space-y-6">
          <TextTabs tabs={SETTINGS_TABS} active={settingsTab} onChange={setSettingsTab} />
          <div className="max-w-2xl">
            {settingsTab === "password" && user && <PasswordCard hasPassword={user.has_password} />}
            {settingsTab === "security" && user && <TwoFactorCard user={user} />}
            {settingsTab === "connection" && (
              <Card className="space-y-2 p-5 text-sm text-muted-foreground">
                <h2 className="font-display font-bold tracking-tight text-foreground">
                  Connection
                </h2>
                <p>
                  Server: <span className="font-mono text-xs">{apiBaseUrl()}</span>
                </p>
                <p className="text-xs">
                  Streamers and admins: manage streams and communities from the{" "}
                  <strong className="text-foreground">Adda Console</strong> desktop app.
                </p>
              </Card>
            )}
          </div>
        </div>
      )}
    </DashboardShell>
  );
}

export default function DashboardPage() {
  return <Dashboard />;
}
