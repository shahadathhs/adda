import { useState } from "react";
import { getToken } from "@adda/api-client";
import { hasServerConfig } from "@adda/shared";
import { Radio } from "lucide-react";
import { Button } from "@/ui/button";
import { useSession, useLogout } from "@/lib/session";
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

function NotAnOperator({ onSignOut }: { onSignOut: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 bg-bg">
      <p className="max-w-64 text-center text-xs text-muted">
        This account isn't an operator. Ask an admin to promote it, then sign in again — or use this
        account in the web app instead.
      </p>
      <Button variant="ghost" size="sm" onClick={onSignOut}>
        Back to sign in
      </Button>
    </div>
  );
}

export function App() {
  const [configured, setConfigured] = useState(hasServerConfig());
  const hasToken = !!getToken();
  const session = useSession();
  const logout = useLogout();

  if (!configured) {
    return <ConnectionView onConnected={() => setConfigured(true)} />;
  }
  if (!hasToken) {
    return <LoginView />;
  }
  if (session.isPending) {
    return <Splash label="Signing in…" />;
  }
  if (session.isError || !session.data) {
    return <LoginView />;
  }
  if (session.data.system_role === "user") {
    return <NotAnOperator onSignOut={() => logout.mutate()} />;
  }
  return <ConsoleLayout user={session.data} />;
}
