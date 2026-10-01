import React from "react";
import ReactDOM from "react-dom/client";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { RouterProvider } from "@tanstack/react-router";
import { Providers } from "./app/providers";
import { router } from "./app/router";
import { getToken } from "@/shared/api/client";
import { hasServerConfig, isDesktopApp } from "@/shared/config";
import { useMe } from "@/features/auth/hooks";
import { ServerSetupScreen } from "@/features/server-config/ServerSetupScreen";
import { GOOGLE_CLIENT_ID } from "@/features/auth/google-config";
import "./index.css";

/**
 * Resolves the session (via `/me`) before the router mounts, so route
 * `beforeLoad` guards can read the settled user from the query cache instead
 * of racing the fetch.
 */
function Boot() {
  const needsServer = isDesktopApp && !hasServerConfig();
  const token = getToken();
  const { isLoading } = useMe();

  // Desktop first run: no server configured yet — ask for one.
  if (needsServer) {
    return <ServerSetupScreen />;
  }
  if (token && isLoading) {
    return (
      <div className="flex h-screen items-center justify-center text-muted-foreground">
        Loading…
      </div>
    );
  }
  return <RouterProvider router={router} />;
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <Providers>
        <Boot />
      </Providers>
    </GoogleOAuthProvider>
  </React.StrictMode>,
);
