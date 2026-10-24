"use client";

import type { ReactNode } from "react";
import { RequireAuth } from "@/components/app-shell";

/** The studio page frame: sign-in required, then the content. */
export function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <RequireAuth>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">{children}</main>
    </RequireAuth>
  );
}
