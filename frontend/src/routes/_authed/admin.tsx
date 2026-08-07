import { createFileRoute, redirect } from "@tanstack/react-router";
import { readUser } from "@/features/auth/hooks";
import AdminPage from "@/pages/AdminPage";

export const Route = createFileRoute("/_authed/admin")({
  beforeLoad: ({ context }) => {
    if (!readUser(context.queryClient)?.is_admin) {
      throw redirect({ to: "/home" });
    }
  },
  component: AdminPage,
});
