import { QueryClient } from "@tanstack/react-query";

/**
 * Shared QueryClient. Server state lives here (caching, invalidation, retries);
 * components consume it via the per-feature hooks (added in a later phase).
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
    mutations: {
      retry: 0,
    },
  },
});
