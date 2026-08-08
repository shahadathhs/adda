import { createFileRoute } from "@tanstack/react-router";
import { LiveTab } from "@/features/admin/components/LiveTab";

export const Route = createFileRoute("/admin/live")({
  component: LivePage,
});

function LivePage() {
  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold">Live Streams</h1>
      <LiveTab />
    </div>
  );
}
