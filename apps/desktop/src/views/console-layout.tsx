import { useEffect, useMemo, useState } from "react";
import {
  Boxes,
  Film,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Radio,
  RefreshCw,
  Settings,
  Users,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import type { User } from "@adda/types";
import { apiBaseUrl } from "@adda/shared";
import { socket } from "@adda/api-client";
import { cn } from "@/ui/cn";
import { Badge } from "@/ui/badge";
import { CommandPalette, type PaletteAction } from "@/ui/command-palette";
import { useAdminLive, useStreamEvents } from "@/lib/data";
import { useLogout } from "@/lib/session";
import { DashboardView } from "./dashboard-view";
import { StreamsView } from "./streams-view";
import { CommunitiesView } from "./communities-view";
import { UsersView } from "./users-view";
import { RecordingsView } from "./recordings-view";
import { ChatView } from "./chat-view";
import { SettingsView } from "./settings-view";

export type ViewId =
  "dashboard" | "streams" | "communities" | "users" | "recordings" | "chat" | "settings";

const VIEWS: { id: ViewId; label: string; icon: typeof Radio }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "streams", label: "Streams", icon: Radio },
  { id: "communities", label: "Communities", icon: Boxes },
  { id: "users", label: "Users", icon: Users },
  { id: "recordings", label: "Recordings", icon: Film },
  { id: "chat", label: "Chat", icon: MessageSquare },
  { id: "settings", label: "Settings", icon: Settings },
];

export function ConsoleLayout({ user }: { user: User }) {
  const [view, setView] = useState<ViewId>("dashboard");
  const [paletteOpen, setPaletteOpen] = useState(false);
  const qc = useQueryClient();
  const logout = useLogout();
  const { data: live = [] } = useAdminLive();
  useStreamEvents(true);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
      if (mod && /^[1-7]$/.test(e.key)) {
        e.preventDefault();
        setView(VIEWS[Number(e.key) - 1]!.id);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const actions = useMemo<PaletteAction[]>(() => {
    const nav = VIEWS.map((v, i) => ({
      id: `go-${v.id}`,
      label: `Go to ${v.label}`,
      hint: `⌘${i + 1}`,
      group: "Navigate",
      onSelect: () => setView(v.id),
    }));
    const firstLive = live[0];
    return [
      ...nav,
      {
        id: "refresh",
        label: "Refresh all data",
        hint: "↻",
        group: "Actions",
        onSelect: () => qc.invalidateQueries(),
      },
      {
        id: "logout",
        label: "Sign out",
        group: "Actions",
        onSelect: () => logout.mutate(),
      },
      ...(firstLive
        ? [
            {
              id: "streams-live",
              label: `${live.length} stream${live.length === 1 ? "" : "s"} live — open Streams`,
              group: "Status",
              onSelect: () => setView("streams" as ViewId),
            },
          ]
        : []),
    ];
  }, [live, logout, qc]);

  return (
    <div className="flex h-full flex-col bg-bg">
      <div className="flex min-h-0 flex-1">
        {/* Sidebar */}
        <aside className="flex w-48 shrink-0 flex-col border-r border-line bg-panel">
          <div className="flex h-10 items-center gap-2 border-b border-line px-3">
            <Radio className="h-3.5 w-3.5 text-accent" />
            <span className="text-xs font-semibold tracking-wide">adda Console</span>
          </div>
          <nav className="flex-1 p-1.5">
            {VIEWS.map((v, i) => (
              <button
                key={v.id}
                onClick={() => setView(v.id)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-xs transition-colors",
                  view === v.id
                    ? "bg-accent/15 text-fg"
                    : "text-muted hover:bg-panel2 hover:text-fg",
                )}
              >
                <v.icon className="h-3.5 w-3.5" />
                {v.label}
                <span className="ml-auto font-num text-2xs text-muted/60">⌘{i + 1}</span>
              </button>
            ))}
          </nav>
          <div className="border-t border-line p-1.5">
            <button
              onClick={() => logout.mutate()}
              className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-xs text-muted transition-colors hover:bg-panel2 hover:text-fg"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </button>
          </div>
        </aside>

        {/* Content */}
        <main className="min-w-0 flex-1 overflow-y-auto">
          {view === "dashboard" && <DashboardView onNavigate={setView} />}
          {view === "streams" && <StreamsView />}
          {view === "communities" && <CommunitiesView />}
          {view === "users" && <UsersView />}
          {view === "recordings" && <RecordingsView />}
          {view === "chat" && <ChatView />}
          {view === "settings" && <SettingsView user={user} />}
        </main>
      </div>

      {/* Status bar */}
      <footer className="flex h-6 shrink-0 items-center gap-3 border-t border-line bg-panel px-3 text-2xs text-muted">
        <span className="flex items-center gap-1.5">
          <span
            className={cn("h-1.5 w-1.5 rounded-full", socket.connected ? "bg-ok" : "bg-muted/50")}
          />
          {socket.connected ? "Realtime" : "Offline"}
        </span>
        <span className="truncate font-num">{apiBaseUrl()}</span>
        <button
          className="flex items-center gap-1 hover:text-fg"
          onClick={() => qc.invalidateQueries()}
        >
          <RefreshCw className="h-3 w-3" /> Refresh
        </button>
        <div className="ml-auto flex items-center gap-2">
          {live.length > 0 && (
            <Badge tone="live">
              {live.length} live · {live.reduce((n, s) => n + s.viewers, 0)} viewers
            </Badge>
          )}
          <span>{user.email}</span>
        </div>
      </footer>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} actions={actions} />
    </div>
  );
}
