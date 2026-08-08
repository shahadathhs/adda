import { createFileRoute, Link, Outlet, redirect } from "@tanstack/react-router";
import { FiGrid, FiUsers, FiRadio, FiVideo, FiLogOut, FiBox } from "react-icons/fi";
import { readUser, useMe } from "@/features/auth/hooks";
import { UserAvatar } from "@/shared/ui/user-avatar";
import { clearToken } from "@/shared/api/client";

export const Route = createFileRoute("/admin")({
  beforeLoad: ({ context }) => {
    const user = readUser(context.queryClient);
    if (!user) throw redirect({ to: "/login" });
    if (!user.is_admin) throw redirect({ to: "/home" });
  },
  component: AdminLayout,
});

const NAV = [
  { to: "/admin/overview", icon: FiGrid, label: "Overview" },
  { to: "/admin/users", icon: FiUsers, label: "Users" },
  { to: "/admin/communities", icon: FiBox, label: "Communities" },
  { to: "/admin/live", icon: FiRadio, label: "Live" },
  { to: "/admin/recordings", icon: FiVideo, label: "Recordings" },
] as const;

function AdminLayout() {
  const { data: user } = useMe();

  const handleLogout = () => {
    clearToken();
    window.location.href = "/login";
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="flex w-60 shrink-0 flex-col border-r border-border bg-muted/30">
        <div className="px-4 py-5">
          <span className="bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-lg font-bold text-transparent">
            adda admin
          </span>
        </div>

        <nav className="flex-1 space-y-0.5 px-2">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              activeProps={{
                className: "bg-primary/10 text-primary",
              }}
              activeOptions={{ exact: false }}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          ))}
        </nav>

        {/* User + logout */}
        <div className="border-t border-border p-3">
          <div className="mb-2 flex items-center gap-2 px-1">
            <UserAvatar
              name={user?.display_name ?? "Admin"}
              src={user?.avatar_url}
              className="h-8 w-8 text-xs"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{user?.display_name}</p>
              <p className="text-xs text-muted-foreground">Admin</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <FiLogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
