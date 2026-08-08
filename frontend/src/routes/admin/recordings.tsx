import { createFileRoute } from "@tanstack/react-router";
import { RecordingsTab } from "@/features/admin/components/RecordingsTab";

export const Route = createFileRoute("/admin/recordings")({
  component: RecordingsPage,
});

function RecordingsPage() {
  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold">Recordings</h1>
      <RecordingsTab />
    </div>
  );
}
