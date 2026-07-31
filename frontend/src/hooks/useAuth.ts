import { useEffect, useState } from "react";
import { useAuthStore } from "../store/auth-store";

export function useAuth() {
  const { user, loading, login, register, logout, init } = useAuthStore();
  return { user, loading, login, register, logout, init };
}

// Ensures auth init runs once.
export function useRequireAuth() {
  const { user, loading, init } = useAuthStore();
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!started) {
      setStarted(true);
      init();
    }
  }, [init, started]);

  return { user, loading };
}
