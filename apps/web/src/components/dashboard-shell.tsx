"use client";

import type { ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MessagesSquare, Settings, Sparkles, UserRound } from "lucide-react";
import { RequireAuth } from "@/components/app-shell";
import { PillTabs } from "@/components/page-tabs";

/**
 * The user dashboard — ONE surface (reference: Simfree dashboards):
 * big title, primary pill tabs (Profile / Messages / Studio / Settings),
 * content below. Personal tools are tabs of this page, not nav items.
 */
export function DashboardShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const params = useSearchParams();
  const tab = params.get("tab") ?? "profile";

  return (
    <RequireAuth>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <h1 className="font-display text-3xl font-bold uppercase tracking-tight text-foreground">
          Dashboard
        </h1>
        <div className="mt-5">
          <PillTabs
            tabs={[
              {
                id: "profile",
                label: "Profile",
                icon: <UserRound className="h-4 w-4" aria-hidden="true" />,
              },
              {
                id: "messages",
                label: "Messages",
                icon: <MessagesSquare className="h-4 w-4" aria-hidden="true" />,
              },
              {
                id: "studio",
                label: "Studio",
                icon: <Sparkles className="h-4 w-4" aria-hidden="true" />,
              },
              {
                id: "settings",
                label: "Settings",
                icon: <Settings className="h-4 w-4" aria-hidden="true" />,
              },
            ]}
            active={tab}
            onChange={(id) => router.replace(`/dashboard?tab=${id}`, { scroll: false })}
          />
        </div>
        <div className="mt-8">{children}</div>
      </main>
    </RequireAuth>
  );
}
