"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { StudioClient } from "@/components/studio-client";

/** The studio. Old `?tab=profile` and `?tab=settings` links go to the settings pages. */
export default function DashboardPage() {
  const router = useRouter();
  const tab = useSearchParams().get("tab");
  const toSettings = tab === "profile" || tab === "settings";

  useEffect(() => {
    if (toSettings) router.replace("/settings");
  }, [toSettings, router]);

  if (toSettings) return null;
  return (
    <DashboardShell>
      <StudioClient />
    </DashboardShell>
  );
}
