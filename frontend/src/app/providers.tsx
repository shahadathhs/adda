import type { ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster } from "@/shared/ui/sonner";
import { queryClient } from "./query-client";

/** Top-level providers: React Query + Sonner toaster. Router is mounted inside. */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster richColors position="top-right" />
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} position="bottom" />}
    </QueryClientProvider>
  );
}
