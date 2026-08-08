import { createFileRoute } from "@tanstack/react-router";
import { useMe } from "@/features/auth/hooks";
import { UsersTab } from "@/features/admin/components/UsersTab";

export const Route = createFileRoute("/admin/users")({
  component: UsersPage,
});

function UsersPage() {
  const { data: user } = useMe();

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold">Users</h1>
      <UsersTab selfId={user?.id} />
    </div>
  );
}
