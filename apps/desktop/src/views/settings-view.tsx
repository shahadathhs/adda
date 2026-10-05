import { useState } from "react";
import { Radio } from "lucide-react";
import type { User } from "@adda/types";
import { apiBaseUrl, getServerConfig, setServerConfig } from "@adda/shared";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Panel, PanelHeader } from "@/ui/panel";
import { useLogout } from "@/lib/session";

export function SettingsView({ user }: { user: User }) {
  const current = getServerConfig();
  const [url, setUrl] = useState(current.api);
  const [hls, setHls] = useState(current.hls);
  const logout = useLogout();

  return (
    <div className="max-w-xl space-y-4 p-4">
      <h1 className="text-sm font-semibold">Settings</h1>

      <Panel>
        <PanelHeader title="Connection" />
        <div className="space-y-3 p-3">
          <div>
            <label className="mb-1 block text-2xs font-medium uppercase tracking-wider text-muted">
              API server
            </label>
            <Input value={url} onChange={(e) => setUrl(e.target.value)} className="font-num" />
          </div>
          <div>
            <label className="mb-1 block text-2xs font-medium uppercase tracking-wider text-muted">
              HLS (mediamtx) server
            </label>
            <Input value={hls} onChange={(e) => setHls(e.target.value)} className="font-num" />
          </div>
          <div className="flex justify-end">
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setServerConfig(url.trim(), hls.trim());
                window.location.reload();
              }}
            >
              Save & reconnect
            </Button>
          </div>
          <p className="text-2xs leading-relaxed text-muted">
            Active: <span className="font-num">{apiBaseUrl()}</span> — the app restarts its data
            layer after saving. Tokens for the previous server are cleared if the address changes.
          </p>
        </div>
      </Panel>

      <Panel>
        <PanelHeader title="Account" />
        <div className="space-y-2 p-3 text-xs">
          <div className="flex justify-between">
            <span className="text-muted">Signed in as</span>
            <span>{user.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Role</span>
            <span className="font-num">{user.system_role}</span>
          </div>
          <div className="flex justify-end pt-1">
            <Button variant="danger" size="sm" onClick={() => logout.mutate()}>
              Sign out
            </Button>
          </div>
        </div>
      </Panel>

      <Panel>
        <PanelHeader title="About" />
        <div className="flex items-center gap-2.5 p-3">
          <Radio className="h-4 w-4 text-accent" />
          <p className="text-2xs text-muted">
            Adda Console v{__APP_VERSION__} — creator client for a self-hosted adda instance.
            Viewers use the web app; this console is for stream and community management.
          </p>
        </div>
      </Panel>
    </div>
  );
}
