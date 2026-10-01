import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { clearSession, login, logout, me, setSession, verify2faLogin } from "@adda/api-client";
import type { Token, User } from "@adda/types";
import { toast } from "sonner";

export const sessionKeys = {
  me: ["session", "me"] as const,
};

/** Boot-time session check: resolves the operator or errors when expired. */
export function useSession() {
  return useQuery({
    queryKey: sessionKeys.me,
    queryFn: me,
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
      qc.clear();
    },
  });
}
