import { useEffect, useState } from "react";
import { Radio } from "lucide-react";
import { getToken } from "@adda/api-client";
import { hasServerConfig } from "@adda/shared";
import { cn } from "@/ui/cn";
import { TitleBarHeader } from "@/ui/titlebar";
import { WindowControls } from "@/ui/window-controls";
import { useSession } from "@/lib/session";
import { ConnectionView } from "@/views/connection-view";
import { LoginView } from "@/views/login-view";
import { ConsoleLayout } from "@/views/console-layout";

const isMac = /Mac/.test(navigator.userAgent);

/** Minimal drag-region titlebar shown on every pre-auth screen. */
function PreAuthHeader() {
  return (
    <TitleBarHeader
      className={cn(
        // Same line as the macOS traffic lights (see console-layout).
        isMac ? "h-8 pl-20" : "h-9 pl-3",
      )}
    >
      <span className="flex items-center gap-2 self-stretch px-2 text-2xs leading-none text-muted">
        <Radio className="h-3.5 w-3.5 text-accent" />
        adda Console
      </span>
      {!isMac && <WindowControls />}
    </TitleBarHeader>
  );
}

function PreAuthScreen({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full flex-col bg-bg">
      <PreAuthHeader />
      <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}

function Splash({ label }: { label: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 bg-bg text-muted">
      <Radio className="h-5 w-5 animate-pulse text-accent" />
      <p className="text-2xs">{label}</p>
    </div>
  );
}

export function App() {
  const [configured, setConfigured] = useState(hasServerConfig());
  // Set by the signed-out event from useLogout — a guaranteed screen flip
  // that doesn't depend on query-cache notification semantics.
  const [signedOut, setSignedOut] = useState(false);
  const hasToken = !!getToken();
  const session = useSession();
  const { data: user, isPending, isError } = session;

  useEffect(() => {
    const onSignedOut = () => setSignedOut(true);
    window.addEventListener("adda:signed-out", onSignedOut);
    return () => window.removeEventListener("adda:signed-out", onSignedOut);
  }, []);

  // Signing in again (session data arrives) deactivates the logout gate.
  const loggedOut = (signedOut || !hasToken) && !user;

  if (!configured) {
    return (
      <PreAuthScreen>
        <ConnectionView
          onConnected={() => setConfigured(true)}
          onCancel={hasToken || session.data ? undefined : () => setConfigured(true)}
        />
      </PreAuthScreen>
    );
  }
  if (loggedOut) {
    return (
      <PreAuthScreen>
        <LoginView onChangeServer={() => setConfigured(false)} />
      </PreAuthScreen>
    );
  }
  if (isPending) {
    return (
      <PreAuthScreen>
        <Splash label="Signing in…" />
      </PreAuthScreen>
    );
  }
  if (isError || !user) {
    return (
      <PreAuthScreen>
        <LoginView onChangeServer={() => setConfigured(false)} />
      </PreAuthScreen>
    );
  }
  return <ConsoleLayout user={user} />;
}
