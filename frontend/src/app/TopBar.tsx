import { Link } from "@tanstack/react-router";
import { UserAvatar } from "@/shared/ui/user-avatar";
import { Button } from "@/shared/ui/button";
import { useAuthStore } from "@/features/auth/store";

export function TopBar() {
  const { user, logout } = useAuthStore();
  return (
    <header className="flex h-14 items-center justify-between border-b border-border px-4">
      <div className="flex items-center gap-2">
        <Link
          to="/"
          className="bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-xl font-bold text-transparent"
        >
          adda
        </Link>
        {user?.is_admin && (
          <Link
            to="/admin"
            className="rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Admin
          </Link>
        )}
      </div>
      {user && (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <UserAvatar name={user.display_name} src={user.avatar_url} />
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {user.display_name}
            </span>
          </div>
          <Button variant="ghost" size="sm" onClick={logout}>
            Logout
          </Button>
        </div>
      )}
    </header>
  );
}
