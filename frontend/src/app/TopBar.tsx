import { Link, useNavigate } from "@tanstack/react-router";
import { Settings } from "lucide-react";
import { UserAvatar } from "@/shared/ui/user-avatar";
import { Button } from "@/shared/ui/button";
import { ThemeToggle } from "@/shared/ui/theme-toggle";
import { useLogout, useMe } from "@/features/auth/hooks";

export function TopBar() {
  const { data: user } = useMe();
  const logout = useLogout();
  const navigate = useNavigate();

  return (
    <header className="flex h-14 items-center justify-between border-b border-border px-4">
      <div className="flex items-center gap-2">
        <Link
          to="/"
          className="bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-xl font-bold text-transparent"
        >
          adda
        </Link>
        {(user?.system_role === "admin" || user?.system_role === "superadmin") && (
          <Link
            to="/admin"
            className="rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Admin
          </Link>
        )}
      </div>
      <div className="flex items-center gap-3">
        <ThemeToggle />
        {user && (
          <>
            <Link
              to="/settings"
              className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Settings"
            >
              <Settings className="h-4 w-4" />
            </Link>
            <div className="flex items-center gap-2">
              <UserAvatar name={user.display_name} src={user.avatar_url} />
              <span className="hidden text-sm text-muted-foreground sm:inline">
                {user.display_name}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                logout();
                navigate({ to: "/login" });
              }}
            >
              Logout
            </Button>
          </>
        )}
      </div>
    </header>
  );
}
