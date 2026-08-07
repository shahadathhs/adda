import { createFileRoute, redirect } from "@tanstack/react-router";
import { readUser } from "@/features/auth/hooks";
import LandingPage from "@/pages/LandingPage";

export const Route = createFileRoute("/")({
  beforeLoad: ({ context }) => {
    // Authed users landing on "/" bounce to their home feed.
    if (readUser(context.queryClient)) {
      throw redirect({ to: "/home" });
    }
  },
  component: LandingPage,
});
