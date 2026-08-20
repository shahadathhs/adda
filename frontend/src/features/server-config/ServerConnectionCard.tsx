import { useState } from "react";
import { Server } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { clearServerConfig, getServerConfig, setServerConfig } from "@/shared/config";

/** Settings card for viewing/changing the server this client talks to. */
export function ServerConnectionCard() {
  const current = getServerConfig();
  const [api, setApi] = useState(current.api);
  const [hls, setHls] = useState(current.hls);
  const [error, setError] = useState<string | null>(null);

  const save = () => {
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

  const reset = () => {
    clearServerConfig();
    window.location.reload();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-3 space-y-0">
        <Server className="h-5 w-5 text-muted-foreground" />
        <div className="space-y-1">
          <CardTitle className="text-lg">Connection</CardTitle>
          <CardDescription>The adda server this app connects to.</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="conn-api" className="text-sm font-medium">
            Server address
          </label>
          <Input id="conn-api" value={api} onChange={(e) => setApi(e.target.value)} />
        </div>
        <div className="space-y-2">
          <label htmlFor="conn-hls" className="text-sm font-medium">
            Streaming address
          </label>
          <Input id="conn-hls" value={hls} onChange={(e) => setHls(e.target.value)} />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex gap-2">
          <Button onClick={save}>Save &amp; reconnect</Button>
          <Button variant="outline" onClick={reset}>
            Reset to default
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
