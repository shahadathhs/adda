import { createFileRoute } from "@tanstack/react-router";
import { CommunitiesTab } from "@/features/admin/components/CommunitiesTab";

export const Route = createFileRoute("/admin/communities")({
  head: () => ({
    title: "Communities — adda Admin",
    meta: [
      {
        name: "description",
        content: "Manage communities and moderation.",
      },
      { property: "og:title", content: "Communities — adda Admin" },
      { property: "og:description", content: "Manage communities and moderation." },
    ],
  }),
  component: CommunitiesPage,
});

function CommunitiesPage() {
  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold">Communities</h1>
      <CommunitiesTab />
    </div>
  );
}
