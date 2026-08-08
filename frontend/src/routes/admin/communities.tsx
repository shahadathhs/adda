import { createFileRoute } from "@tanstack/react-router";
import { CommunitiesTab } from "@/features/admin/components/CommunitiesTab";

export const Route = createFileRoute("/admin/communities")({
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
