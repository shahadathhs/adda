import { useState } from "react";
import { Server } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { deriveHlsBase, setServerConfig } from "@/shared/config";

/**
 * First-run screen for the desktop app: pick the adda server to connect to.
 * Saving persists the config and reloads so the whole app boots against it.
 */
export function ServerSetupScreen() {
  const [api, setApi] = useState("http://localhost:7001");
  const [hls, setHls] = useState("");
  const [error, setError] = useState<string | null>(null);

  const connect = () => {
    try {
      const url = new URL(api);
      if (url.protocol !== "http:" && url.protocol !== "https:") {
        throw new Error("bad protocol");
      }
      setServerConfig(api, hls || undefined);
      window.location.reload();
    } catch {
      setError("Enter a valid server address, e.g. http://192.168.1.10:7001");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Connect to a server
          </CardTitle>
          <CardDescription>
            Enter the address of your adda instance (the backend API).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="server-api" className="text-sm font-medium">
              Server address
            </label>
            <Input
              id="server-api"
              value={api}
              onChange={(e) => setApi(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && connect()}
              placeholder="http://192.168.1.10:7001"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="server-hls" className="text-sm font-medium">
              Streaming address <span className="text-muted-foreground">(optional)</span>
            </label>
            <Input
              id="server-hls"
              value={hls}
              onChange={(e) => setHls(e.target.value)}
              placeholder={deriveHlsBase(api)}
            />
            <p className="text-xs text-muted-foreground">Defaults to the same host on port 8888.</p>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button className="w-full" onClick={connect}>
            Connect
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
