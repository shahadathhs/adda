import { useEffect } from "react";
import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { Toaster } from "react-hot-toast";
import { Providers } from "./app/providers";
import { router } from "./app/router";
import { useAuthStore } from "./features/auth/store";
import "./index.css";

function Root() {
  const loading = useAuthStore((s) => s.loading);
  const init = useAuthStore((s) => s.init);

  // Resolve the session once before the router mounts, so route `beforeLoad`
  // guards see a settled user instead of racing the `/me` call.
  useEffect(() => {
    init();
  }, [init]);

  return (
    <Providers>
      {loading ? (
        <div className="flex h-screen items-center justify-center text-muted-foreground">
          Loading…
        </div>
      ) : (
        <RouterProvider router={router} />
      )}
      <Toaster position="bottom-right" />
    </Providers>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
);
