import { useState } from "react";
import { useAuthStore } from "@/features/auth/store";
import { useAdminStats } from "@/features/admin/hooks";
import { StatCard } from "@/features/admin/components/StatCard";
import { UsersTab } from "@/features/admin/components/UsersTab";
import { CommunitiesTab } from "@/features/admin/components/CommunitiesTab";
import { LiveTab } from "@/features/admin/components/LiveTab";
import { RecordingsTab } from "@/features/admin/components/RecordingsTab";

const TABS = ["Users", "Communities", "Live", "Recordings"] as const;
type Tab = (typeof TABS)[number];

export default function AdminPage() {
  const { user } = useAuthStore();
  const [tab, setTab] = useState<Tab>("Users");
  const { data: stats } = useAdminStats();

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Admin</h1>
        <p className="text-sm text-muted-foreground">Platform overview &amp; management.</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Users" value={stats?.users ?? 0} />
        <StatCard label="Communities" value={stats?.communities ?? 0} />
        <StatCard label="Live now" value={stats?.live ?? 0} accent="text-red-400" />
      </div>

      <div className="flex gap-1 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              tab === t
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Users" && <UsersTab selfId={user?.id} />}
      {tab === "Communities" && <CommunitiesTab />}
      {tab === "Live" && <LiveTab />}
      {tab === "Recordings" && <RecordingsTab />}
    </div>
  );
}
