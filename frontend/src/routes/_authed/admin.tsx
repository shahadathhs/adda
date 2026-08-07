import { createFileRoute, redirect } from "@tanstack/react-router";
import { useAuthStore } from "@/features/auth/store";
import AdminPage from "@/pages/AdminPage";

export const Route = createFileRoute("/_authed/admin")({
  beforeLoad: () => {
    if (!useAuthStore.getState().user?.is_admin) {
      throw redirect({ to: "/home" });
    }
  },
  component: AdminPage,
});
