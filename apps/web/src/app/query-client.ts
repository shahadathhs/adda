import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { ApiError, clearSession } from "@/shared/api/client";

/**
 * On a 401 from any query/mutation, the session is gone (the request helper
 * already tried a refresh) — clear tokens and bounce to /login with a full
 * reload (drops stale cache + React state). The auth store's own `/me` call on
 * boot is handled separately (it catches 401 gracefully to show the landing
 * page instead).
 */
function onAuthFailure(err: unknown) {
  if (err instanceof ApiError && err.status === 401) {
    clearSession();
    if (typeof window !== "undefined") {
      window.location.assign("/login");
    }
  }
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: onAuthFailure }),
  mutationCache: new MutationCache({ onError: onAuthFailure }),
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: (failureCount, err) =>
        !(err instanceof ApiError && err.status === 401) && failureCount < 1,
    },
    mutations: {
      retry: 0,
    },
  },
});
