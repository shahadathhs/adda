import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { TopBar } from "@/app/TopBar";
import { useAuthStore } from "@/features/auth/store";

/**
 * Pathless layout for every authenticated screen. Renders the TopBar shell and
 * guards its children via `beforeLoad` — unauthenticated visitors are sent to
 * the login page before any child component mounts.
 */
export const Route = createFileRoute("/_authed")({
  beforeLoad: () => {
    if (!useAuthStore.getState().user) {
      throw redirect({ to: "/login" });
    }
  },
  component: AuthedLayout,
});

function AuthedLayout() {
  return (
    <div className="flex h-screen flex-col">
      <TopBar />
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
