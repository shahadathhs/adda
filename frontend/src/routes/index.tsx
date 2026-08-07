import { createFileRoute, redirect } from "@tanstack/react-router";
import { useAuthStore } from "@/features/auth/store";
import LandingPage from "@/pages/LandingPage";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    // Authed users landing on "/" bounce to their home feed.
    if (useAuthStore.getState().user) {
      throw redirect({ to: "/home" });
    }
  },
  component: LandingPage,
});
