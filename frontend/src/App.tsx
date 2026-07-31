import { useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { socket } from "./lib/ws";
import { useAuthStore } from "./store/auth-store";
import { Avatar } from "./components/ui/Avatar";
import { Button } from "./components/ui/Button";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import CommunityPage from "./pages/CommunityPage";

function TopBar() {
  const { user, logout } = useAuthStore();
  return (
    <header className="flex h-14 items-center justify-between border-b border-border px-4">
      <div className="flex items-center gap-2">
        <span className="bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-xl font-bold text-transparent">
          adda
        </span>
      </div>
      {user && (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Avatar name={user.display_name} src={user.avatar_url} />
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

export default function App() {
  const { user, loading, init } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    init();
  }, [init]);

  // Keep the socket alive whenever we're authenticated.
  useEffect(() => {
    if (user) socket.connect();
    return () => {
      // leave socket management to the app lifetime
    };
  }, [user]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="*" element={<LoginPage />} />
      </Routes>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      <TopBar />
      <main className="flex-1 overflow-hidden">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/community/:id" element={<CommunityPage />} />
          <Route path="*" element={<Navigate to="/" replace state={{ from: location }} />} />
        </Routes>
      </main>
    </div>
  );
}
