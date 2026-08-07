import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { clearToken, getToken, setToken } from "@/shared/api/client";
import { login as loginApi, me, register as registerApi } from "./api";
import type { User } from "./types";

export const authKeys = {
  me: ["auth", "me"] as const,
};

/**
 * The current session. Only fetches `/me` when a token is present; the boot
 * gate in main.tsx awaits it before mounting the router so route guards can
 * read the resolved user from the query cache.
 */
export const useMe = () =>
  useQuery({
    queryKey: authKeys.me,
    queryFn: me,
    enabled: !!getToken(),
  });

export const useLogin = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: loginApi,
    onSuccess: (token) => {
      setToken(token.access_token);
      qc.setQueryData(authKeys.me, token.user);
    },
  });
};

export const useRegister = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: registerApi,
    onSuccess: (token) => {
      setToken(token.access_token);
      qc.setQueryData(authKeys.me, token.user);
    },
  });
};

/** Synchronously read the cached user (for non-React contexts like route guards). */
export function readUser(qc: ReturnType<typeof useQueryClient>): User | null {
  return qc.getQueryData<User>(authKeys.me) ?? null;
}

export function useLogout() {
  const qc = useQueryClient();
  return () => {
    clearToken();
    qc.removeQueries({ queryKey: authKeys.me });
  };
}
