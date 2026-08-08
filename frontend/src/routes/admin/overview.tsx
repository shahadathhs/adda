import { createFileRoute } from "@tanstack/react-router";
import { useAdminStats } from "@/features/admin/hooks";
import { Card } from "@/shared/ui/card";

export const Route = createFileRoute("/admin/overview")({
  component: OverviewPage,
});

function OverviewPage() {
  const { data: stats } = useAdminStats();

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold">Overview</h1>
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="text-3xl font-bold">{stats?.users ?? 0}</div>
          <div className="text-sm text-muted-foreground">Total users</div>
        </Card>
        <Card className="p-6">
          <div className="text-3xl font-bold">{stats?.communities ?? 0}</div>
          <div className="text-sm text-muted-foreground">Communities</div>
        </Card>
        <Card className="p-6">
          <div className="text-3xl font-bold text-red-400">{stats?.live ?? 0}</div>
          <div className="text-sm text-muted-foreground">Live now</div>
        </Card>
      </div>
    </div>
  );
}
