"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { apiBaseUrl } from "@/lib/config";
import { Card } from "@/components/ui/card";
import { DashboardShell } from "@/components/dashboard-shell";
import { TextTabs } from "@/components/page-tabs";
import { ProfileCard } from "@/components/settings-profile-card";
import { PasswordCard } from "@/components/settings-password-card";
import { StudioClient } from "@/components/studio-client";
import { useMe } from "@/lib/session";

const SETTINGS_TABS = [
  { id: "password", label: "Password" },
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
      {tab === "studio" && <StudioClient />}
      {tab === "settings" && (
        <div className="space-y-6">
          <TextTabs tabs={SETTINGS_TABS} active={settingsTab} onChange={setSettingsTab} />
          <div className="max-w-2xl">
            {settingsTab === "password" && user && <PasswordCard />}
            {settingsTab === "connection" && (
              <Card className="space-y-2 p-5 text-sm text-muted-foreground">
                <h2 className="font-display font-bold tracking-tight text-foreground">
                  Connection
                </h2>
                <p>
                  Server: <span className="font-mono text-xs">{apiBaseUrl()}</span>
                </p>
                <p className="text-xs">
                  Streamers: manage your channels from the{" "}
                  <strong className="text-foreground">Studio</strong>.
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
