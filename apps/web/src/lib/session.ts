import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  clearSession,
  getToken,
  login,
  logout,
  me,
  register,
  setSession,
  socket,
  verify2faLogin,
} from "@adda/api-client";
import type { Token, User } from "@adda/types";
import { toast } from "sonner";

export const sessionKeys = { me: ["session", "me"] as const };

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

export function useLogin2fa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ tempToken, code }: { tempToken: string; code: string }) =>
      adoptSession(await verify2faLogin(tempToken, code)),
    onSuccess: (user) => qc.setQueryData(sessionKeys.me, user),
    onError: (e) => toast.error(e instanceof Error ? e.message : "Verification failed"),
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
    onError: (e) => toast.error(e instanceof Error ? e.message : "Registration failed"),
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
          /* best-effort */
        }
      }
      clearSession();
    },
    // Teardown AFTER the mutation settles: qc.clear() would also wipe the
    // running mutation from the cache — removeQueries() touches data only.
    onSettled: () => {
      socket.disconnect();
      qc.removeQueries();
    },
  });
}
