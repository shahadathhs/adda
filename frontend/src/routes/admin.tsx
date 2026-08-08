import { useState } from "react";
import { createFileRoute, Link, Outlet, redirect } from "@tanstack/react-router";
import {
  FiGrid,
  FiUsers,
  FiRadio,
  FiVideo,
  FiLogOut,
  FiBox,
  FiChevronsLeft,
  FiChevronsRight,
} from "react-icons/fi";
import { readUser, useMe } from "@/features/auth/hooks";
import { UserAvatar } from "@/shared/ui/user-avatar";
import { ThemeToggle } from "@/shared/ui/theme-toggle";
import { clearToken } from "@/shared/api/client";
import { cn } from "@/shared/lib/utils";

export const Route = createFileRoute("/admin")({
  beforeLoad: ({ context }) => {
    const user = readUser(context.queryClient);
    if (!user) throw redirect({ to: "/login" });
    if (!user.is_admin) throw redirect({ to: "/home" });
  },
  head: () => ({
    title: "Admin — adda",
    meta: [
      { name: "description", content: "adda admin dashboard." },
      { property: "og:title", content: "Admin — adda" },
      { property: "og:description", content: "adda admin dashboard." },
    ],
  }),
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
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    clearToken();
    window.location.href = "/login";
  };

  return (
    <div className="flex h-screen bg-background">
      <aside
        className={cn(
          "flex shrink-0 flex-col border-r border-border bg-muted/30 transition-all duration-200",
          collapsed ? "w-16" : "w-60",
        )}
      >
        {/* Logo + theme + collapse */}
        <div
          className={cn(
            "px-3 py-4",
            collapsed ? "flex flex-col items-center gap-3" : "flex items-center justify-between",
          )}
        >
          <Link to="/admin/overview" className="shrink-0">
            <img src="/favicon.svg" alt="adda" className="h-7 w-7 rounded-lg" />
          </Link>
          <div className={cn("flex items-center gap-1", collapsed && "flex-col")}>
            <ThemeToggle />
            <button
              onClick={() => setCollapsed((c) => !c)}
              className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              {collapsed ? (
                <FiChevronsRight className="h-4 w-4" />
              ) : (
                <FiChevronsLeft className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-0.5 px-2">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                collapsed && "justify-center px-0",
              )}
              activeProps={{ className: "bg-primary/10 text-primary" }}
              activeOptions={{ exact: false }}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && item.label}
            </Link>
          ))}
        </nav>

        {/* Bottom: user + logout */}
        <div className="border-t border-border p-2">
          <div
            className={cn(
              "flex items-center gap-2 rounded-lg px-1 py-1",
              collapsed && "justify-center px-0",
            )}
          >
            <UserAvatar
              name={user?.display_name ?? "Admin"}
              src={user?.avatar_url}
              className="h-8 w-8 shrink-0 text-xs"
            />
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{user?.display_name}</p>
                <p className="text-xs text-muted-foreground">Admin</p>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            className={cn(
              "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive",
              collapsed && "justify-center px-0",
            )}
            title={collapsed ? "Logout" : undefined}
          >
            <FiLogOut className="h-4 w-4 shrink-0" />
            {!collapsed && "Logout"}
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
