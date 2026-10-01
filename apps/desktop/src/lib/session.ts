import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  clearSession,
  getToken,
  login,
  logout,
  me,
  setSession,
  socket,
  verify2faLogin,
} from "@adda/api-client";
import type { Token, User } from "@adda/types";
import { toast } from "sonner";

export const sessionKeys = {
  me: ["session", "me"] as const,
};

/** Boot-time session check: resolves the user or errors when expired. */
export function useSession() {
  return useQuery({
    queryKey: sessionKeys.me,
    queryFn: me,
    // Tokens live in localStorage (browser only) — never fetch without one.
    enabled: typeof window !== "undefined" && !!getToken(),
    staleTime: Infinity,
    retry: false,
  });
}

export function useSetMe() {
  const qc = useQueryClient();
  return (user: User | null | undefined) => qc.setQueryData(sessionKeys.me, user);
}

async function adoptSession(token: Token): Promise<User> {
  setSession({ access_token: token.access_token, refresh_token: token.refresh_token });
  return me();
}

/** Step 1: email + password → session, or a 2FA challenge. */
export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const res = await login({ email, password });
      if ("requires_2fa" in res) return res;
      return adoptSession(res);
    },
    onSuccess: (data) => {
      if ("id" in data) qc.setQueryData(sessionKeys.me, data);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Login failed"),
  });
}

/** Step 2 (only when challenged): temp token + 6-digit code. */
export function useLogin2fa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ tempToken, code }: { tempToken: string; code: string }) =>
      adoptSession(await verify2faLogin(tempToken, code)),
    onSuccess: (user) => qc.setQueryData(sessionKeys.me, user),
    onError: (e) => toast.error(e instanceof Error ? e.message : "Verification failed"),
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const refresh = localStorage.getItem("adda_refresh_token");
      if (refresh) {
        try {
          await logout(refresh);
        } catch {
          /* best-effort server-side revoke */
        }
      }
      clearSession();
    },
    // Teardown AFTER the mutation settles. removeQueries alone is not enough:
    // it doesn't guarantee a re-render of the app shell (an active observer
    // just silently recreates its query). Explicitly nulling the session
    // query forces the notification that flips App to the login screen.
    onSettled: () => {
      socket.disconnect();
      qc.removeQueries();
      qc.setQueryData(sessionKeys.me, null);
      // Belt and braces: the app shell listens for this and flips to the
      // login screen unconditionally — cache semantics can't eat it.
      window.dispatchEvent(new Event("adda:signed-out"));
    },
  });
}
