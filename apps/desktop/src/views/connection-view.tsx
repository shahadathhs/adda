import { useState } from "react";
import { Radio } from "lucide-react";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { deriveHlsBase, setServerConfig } from "@adda/shared";

export function ConnectionView({ onConnected }: { onConnected: () => void }) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  const connect = () => {
    const trimmed = url.trim();
    if (!/^https?:\/\/.+/.test(trimmed)) {
      setError("Enter the full server URL, e.g. http://localhost:7001");
      return;
    }
    setServerConfig(trimmed);
    onConnected();
  };

  return (
    <div className="flex h-full items-center justify-center bg-bg">
      <div className="w-full max-w-sm rounded-sm border border-line bg-panel p-6">
        <div className="mb-5 flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-accent/15">
            <Radio className="h-4.5 w-4.5 text-accent" />
          </div>
          <div>
            <h1 className=" text-sm font-semibold">adda Console</h1>
            <p className="text-2xs text-muted">Operator control for your adda server</p>
          </div>
        </div>

        <label className="mb-1.5 block text-2xs font-medium uppercase tracking-wider text-muted">
          Server address
        </label>
        <Input
          autoFocus
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            setError(null);
          }}
          onKeyDown={(e) => e.key === "Enter" && connect()}
          placeholder="http://localhost:7001"
          className="h-8"
        />
        {error && <p className="mt-1.5 text-2xs text-danger">{error}</p>}
        <p className="mt-2 text-2xs leading-relaxed text-muted">
          Point the console at your own adda deployment. The streaming (HLS) address is derived
          automatically as {deriveHlsBase(url || "http://localhost")} — change it later in Settings
          → Connection.
        </p>

        <Button variant="primary" className="mt-4 h-8 w-full" onClick={connect}>
          Connect
        </Button>
      </div>
    </div>
  );
}
