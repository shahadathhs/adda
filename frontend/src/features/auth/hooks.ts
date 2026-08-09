import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { clearToken, getToken, setToken } from "@/shared/api/client";
import {
  changePassword as changePasswordApi,
  disable2fa as disable2faApi,
  enable2fa as enable2faApi,
  enable2faVerify as enable2faVerifyApi,
  googleLogin,
  linkGoogle as linkGoogleApi,
  login as loginApi,
  me,
  register as registerApi,
  requestOtp,
  setPassword as setPasswordApi,
  updateProfile as updateProfileApi,
  verify2faLogin as verify2faLoginApi,
  verifyOtp as verifyOtpApi,
} from "./api";
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

function cacheSession(qc: ReturnType<typeof useQueryClient>, user: User) {
  qc.setQueryData(authKeys.me, user);
}

export const useLogin = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: loginApi,
    onSuccess: (res) => {
      if ("access_token" in res) {
        setToken(res.access_token);
        cacheSession(qc, res.user);
      }
      // 2FA challenges ({ requires_2fa, temp_token }) are handled by callers.
    },
  });
};

export const useVerify2faLogin = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { temp_token: string; code: string }) =>
      verify2faLoginApi(args.temp_token, args.code),
    onSuccess: (token) => {
      setToken(token.access_token);
      cacheSession(qc, token.user);
    },
  });
};

export const useGoogleLogin = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id_token: string) => googleLogin(id_token),
    onSuccess: (token) => {
      setToken(token.access_token);
      cacheSession(qc, token.user);
    },
  });
};

export const useRequestOtp = () =>
  useMutation({
    mutationFn: (email: string) => requestOtp(email),
  });

export const useVerifyOtp = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { email: string; code: string }) => verifyOtpApi(args.email, args.code),
    onSuccess: (token) => {
      setToken(token.access_token);
      cacheSession(qc, token.user);
    },
  });
};

export const useRegister = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: registerApi,
    onSuccess: (token) => {
      setToken(token.access_token);
      cacheSession(qc, token.user);
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

// ── Settings ──────────────────────────────────────────────────────────

export const useUpdateProfile = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof updateProfileApi>[0]) => updateProfileApi(data),
    onSuccess: (user) => cacheSession(qc, user),
  });
};

export const useChangePassword = () =>
  useMutation({
    mutationFn: (args: { current_password: string; new_password: string }) =>
      changePasswordApi(args.current_password, args.new_password),
  });

export const useSetPassword = () =>
  useMutation({
    mutationFn: (new_password: string) => setPasswordApi(new_password),
  });

export const useEnable2fa = () =>
  useMutation({
    mutationFn: enable2faApi,
  });

export const useEnable2faVerify = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => enable2faVerifyApi(code),
    onSuccess: () => qc.invalidateQueries({ queryKey: authKeys.me }),
  });
};

export const useDisable2fa = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (password: string) => disable2faApi(password),
    onSuccess: () => qc.invalidateQueries({ queryKey: authKeys.me }),
  });
};

export const useLinkGoogle = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id_token: string) => linkGoogleApi(id_token),
    onSuccess: (user) => cacheSession(qc, user),
  });
};
