import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { TopBar } from "@/app/TopBar";
import { readUser } from "@/features/auth/hooks";

/**
 * Pathless layout for every authenticated screen. Renders the TopBar shell and
 * guards its children via `beforeLoad` — unauthenticated visitors are sent to
 * the login page before any child component mounts. Admins are redirected to
 * the admin dashboard so they never land on the user-facing home page.
 */
export const Route = createFileRoute("/_authed")({
  beforeLoad: ({ context, location }) => {
    const user = readUser(context.queryClient);
    if (!user) {
      throw redirect({ to: "/login" });
    }
    // Admins belong in the admin dashboard, not the user-facing app.
    if (user.system_role !== "user" && !location.pathname.startsWith("/settings")) {
      throw redirect({ to: "/admin/overview" });
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
