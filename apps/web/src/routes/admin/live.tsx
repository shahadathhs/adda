import { createFileRoute } from "@tanstack/react-router";
import { LiveTab } from "@/features/admin/components/LiveTab";

export const Route = createFileRoute("/admin/live")({
  head: () => ({
    title: "Live — adda Admin",
    meta: [
      {
        name: "description",
        content: "Monitor and control live streams.",
      },
      { property: "og:title", content: "Live — adda Admin" },
      { property: "og:description", content: "Monitor and control live streams." },
    ],
  }),
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
