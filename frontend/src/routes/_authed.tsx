import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { TopBar } from "@/app/TopBar";
import { readUser } from "@/features/auth/hooks";

/**
 * Pathless layout for every authenticated screen. Renders the TopBar shell and
 * guards its children via `beforeLoad` — unauthenticated visitors are sent to
 * the login page before any child component mounts.
 */
export const Route = createFileRoute("/_authed")({
  beforeLoad: ({ context }) => {
    if (!readUser(context.queryClient)) {
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
