import { useState } from "react";
import { Radio } from "lucide-react";
import { getToken } from "@adda/api-client";
import { hasServerConfig } from "@adda/shared";
import { cn } from "@/ui/cn";
import { WindowControls } from "@/ui/window-controls";
import { useSession } from "@/lib/session";
import { ConnectionView } from "@/views/connection-view";
import { LoginView } from "@/views/login-view";
import { ConsoleLayout } from "@/views/console-layout";

const isMac = /Mac/.test(navigator.userAgent);

/** Minimal drag-region titlebar shown on every pre-auth screen. */
function PreAuthHeader() {
  return (
    <header
      data-tauri-drag-region
      className={cn(
        "flex items-center border-b border-line bg-bg",
        isMac ? "h-11 pl-20" : "h-9 pl-3",
      )}
    >
      <span data-tauri-drag-region className="flex items-center gap-2 text-2xs text-muted">
        <Radio className="h-3.5 w-3.5 text-accent" />
        adda Console
      </span>
      {!isMac && <WindowControls />}
    </header>
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
  const hasToken = !!getToken();
  const session = useSession();
  const { data: user, isPending, isError } = session;

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
  if (!hasToken) {
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
