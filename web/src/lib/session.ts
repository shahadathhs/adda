import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { clearSession, getToken, login, logout, me, register, setSession, socket } from "@/lib/api";
import type { Token, User } from "@/lib/types";

export const sessionKeys = { me: ["session", "me"] as const };

/** True while a sign-out is in flight, so a protected page does not redirect to /login on its way home. */
let signingOut = false;
export const isSigningOut = () => signingOut;

const hasBrowserToken = () => typeof window !== "undefined" && !!getToken();

export function useMe() {
  return useQuery({
    queryKey: sessionKeys.me,
    queryFn: me,
    // SSR-safe: tokens live in localStorage, which only exists in the browser.
    enabled: hasBrowserToken(),
    staleTime: 60_000,
    retry: false,
  });
}

async function adoptSession(token: Token): Promise<User> {
  setSession({ access_token: token.access_token, refresh_token: token.refresh_token });
  return me();
}

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      return adoptSession(await login({ email, password }));
    },
    onSuccess: (user) => qc.setQueryData(sessionKeys.me, user),
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: (data: {
      username: string;
      email: string;
      password: string;
      display_name: string;
    }) => register(data),
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      signingOut = true;
      const refresh = localStorage.getItem("adda_refresh_token");
      if (refresh) {
        try {
          await logout(refresh);
        } catch {
          /* best-effort */
        }
      }
      clearSession();
    },
    // Teardown AFTER the mutation settles. removeQueries alone is not enough:
    // it doesn't guarantee a re-render of the app shell (an active observer
    // just silently recreates its query). Explicitly nulling the session
    // query forces the notification that flips the app to the login screen.
    onSettled: () => {
      setTimeout(() => (signingOut = false), 1000);
      socket.disconnect();
      qc.removeQueries();
      qc.setQueryData(sessionKeys.me, null);
    },
  });
}
