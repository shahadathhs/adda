import { useState } from "react";
import { getToken } from "@adda/api-client";
import { hasServerConfig } from "@adda/shared";
import { Radio } from "lucide-react";
import { useSession } from "@/lib/session";
import { ConnectionView } from "@/views/connection-view";
import { LoginView } from "@/views/login-view";
import { ConsoleLayout } from "@/views/console-layout";

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
      <ConnectionView
        onConnected={() => setConfigured(true)}
        onCancel={hasToken || session.data ? undefined : () => setConfigured(true)}
      />
    );
  }
  if (!hasToken) {
    return <LoginView onChangeServer={() => setConfigured(false)} />;
  }
  if (isPending) {
    return <Splash label="Signing in…" />;
  }
  if (isError || !user) {
    return <LoginView onChangeServer={() => setConfigured(false)} />;
  }
  return <ConsoleLayout user={user} />;
}
