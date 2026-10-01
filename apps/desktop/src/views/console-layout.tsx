import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Boxes,
  Film,
  Keyboard,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Plus,
  Radio,
  RefreshCw,
  Settings,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { createCommunity } from "@adda/api-client";
import type { Community, User } from "@adda/types";
import { apiBaseUrl } from "@adda/shared";
import { socket } from "@adda/api-client";
import { cn } from "@/ui/cn";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/ui/dialog";
import { Input } from "@/ui/input";
import { CommandPalette, type PaletteAction } from "@/ui/command-palette";
import { useAdminLive, useMyChannels, useStreamEvents } from "@/lib/data";
import { useLogout } from "@/lib/session";
import { checkForUpdate, isNewer } from "@/lib/update-check";
import { DashboardView } from "./dashboard-view";
import { StreamsView } from "./streams-view";
import { CommunitiesView } from "./communities-view";
import { UsersView } from "./users-view";
import { ChannelRecordingsView, RecordingsView } from "./recordings-view";
import { ChatView } from "./chat-view";
import { SettingsView } from "./settings-view";
import { CreatorOverview } from "./creator/overview";
import { CreatorStream } from "./creator/stream";
import { CreatorMembers } from "./creator/members";

export type ViewId =
  | "overview"
  | "stream"
  | "chat"
  | "recordings"
  | "members"
  | "p-dashboard"
  | "p-streams"
  | "p-communities"
  | "p-users"
  | "p-recordings"
  | "settings";

const CHANNEL_STORAGE_KEY = "adda_console_channel";
const VIEW_STORAGE_KEY = "adda_console_view";

const CHANNEL_VIEWS: { id: ViewId; label: string; icon: typeof Radio }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "stream", label: "Stream", icon: Radio },
  { id: "chat", label: "Chat", icon: MessageSquare },
  { id: "recordings", label: "Recordings", icon: Film },
  { id: "members", label: "Members", icon: Users },
];

const PLATFORM_VIEWS: { id: ViewId; label: string; icon: typeof Radio }[] = [
  { id: "p-dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "p-streams", label: "Streams", icon: Radio },
  { id: "p-communities", label: "Communities", icon: Boxes },
  { id: "p-users", label: "Users", icon: Users },
  { id: "p-recordings", label: "Recordings", icon: Film },
];

const SHORTCUTS: [string, string][] = [
  ["⌘K", "Command palette"],
  ["⌘1 … ⌘9", "Switch view (as numbered in the sidebar)"],
  ["⌘/", "This shortcut list"],
];

function loadStored(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function CreateChannelDialog({ onCreated }: { onCreated: (id: string) => void }) {
  const [form, setForm] = useState({ name: "", slug: "", description: "" });
  const create = useMutation({
    mutationFn: () =>
      createCommunity({
        name: form.name,
        slug: form.slug,
        description: form.description || undefined,
      }),
    onSuccess: (c: Community) => {
      toast.success("Channel created");
      onCreated(c.id);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to create"),
  });
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="primary" size="xs">
          <Plus className="h-3 w-3" /> New channel
        </Button>
      </DialogTrigger>
      <DialogContent title="Create a channel">
        <form
          className="space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate();
          }}
        >
          <Input
            required
            placeholder="Channel name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <Input
            required
            pattern="[a-z0-9-]+"
            title="Lowercase letters, numbers, hyphens"
            placeholder="slug (lowercase, hyphens)"
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
          />
          <Input
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <div className="flex justify-end gap-2 pt-1">
            <Button type="submit" variant="primary" size="sm" disabled={create.isPending}>
              {create.isPending ? "Creating…" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ConsoleLayout({ user }: { user: User }) {
  const isStaff = user.system_role !== "user";
  const [selectedId, setSelectedId] = useState<string | null>(() =>
    loadStored(CHANNEL_STORAGE_KEY),
  );
  const [view, setView] = useState<ViewId>(
    () => (loadStored(VIEW_STORAGE_KEY) as ViewId) ?? "overview",
  );
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [updateUrl, setUpdateUrl] = useState<string | null>(null);
  const qc = useQueryClient();
  const logout = useLogout();
  const { data: channels = [], isLoading: loadingChannels } = useMyChannels();
  const { data: live = [] } = useAdminLive();
  useStreamEvents(true, isStaff);

  const selected = useMemo(
    () => channels.find((c) => c.id === selectedId) ?? null,
    [channels, selectedId],
  );

  // Persist selection + view.
  useEffect(() => {
    if (selectedId) {
      try {
        localStorage.setItem(CHANNEL_STORAGE_KEY, selectedId);
      } catch {
        /* ignore */
      }
    }
  }, [selectedId]);
  useEffect(() => {
    try {
      localStorage.setItem(VIEW_STORAGE_KEY, view);
    } catch {
      /* ignore */
    }
  }, [view]);

  // One-shot update check against GitHub releases (silent on failure).
  useEffect(() => {
    void checkForUpdate(__APP_VERSION__).then((info) => {
      if (info?.latest && info.url && isNewer(info.latest, info.current)) {
        setUpdateUrl(info.url);
      }
    });
  }, []);

  const nav = useMemo(() => {
    const items: { section: string; entries: typeof CHANNEL_VIEWS }[] = [];
    if (selected) {
      items.push({ section: "Channel", entries: CHANNEL_VIEWS });
    }
    if (isStaff) {
      items.push({ section: "Platform", entries: PLATFORM_VIEWS });
    }
    return items;
  }, [selected, isStaff]);

  const flatNav = useMemo(() => nav.flatMap((s) => s.entries), [nav]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
      if (mod && e.key === "/") {
        e.preventDefault();
        setHelpOpen((v) => !v);
      }
      if (mod && /^[1-9]$/.test(e.key)) {
        const target = flatNav[Number(e.key) - 1];
        if (target) {
          e.preventDefault();
          setView(target.id);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [flatNav]);

  const actions = useMemo<PaletteAction[]>(() => {
    const channelSwitch: PaletteAction[] = channels.map((c) => ({
      id: `ch-${c.id}`,
      label: `Switch to ${c.name}`,
      hint: c.my_role ?? "",
      group: "Channels",
      onSelect: () => {
        setSelectedId(c.id);
        setView("overview");
      },
    }));
    const navActions: PaletteAction[] = flatNav.map((v) => ({
      id: `go-${v.id}`,
      label: `Go to ${v.label}`,
      group: "Navigate",
      onSelect: () => setView(v.id),
    }));
    return [
      ...channelSwitch,
      ...navActions,
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
    ];
  }, [channels, flatNav, logout, qc]);

  const selectedLive = live.find((s) => s.community_id === selected?.id);

  return (
    <div className="flex h-full flex-col bg-bg">
      <div className="flex min-h-0 flex-1">
        {/* Sidebar */}
        <aside className="flex w-52 shrink-0 flex-col border-r border-line bg-panel">
          <div className="flex h-10 items-center gap-2 border-b border-line px-3">
            <Radio className="h-3.5 w-3.5 text-accent" />
            <span className="text-xs font-semibold tracking-wide">adda Console</span>
          </div>

          {/* Channel picker */}
          <div className="border-b border-line p-1.5">
            <div className="flex items-center justify-between px-1 pb-1">
              <span className="text-2xs font-semibold uppercase tracking-wider text-muted">
                Channel
              </span>
              <CreateChannelDialog
                onCreated={(id) => {
                  qc.invalidateQueries();
                  setSelectedId(id);
                  setView("overview");
                }}
              />
            </div>
            <select
              value={selectedId ?? ""}
              onChange={(e) => {
                setSelectedId(e.target.value || null);
                setView("overview");
              }}
              className="h-7 w-full rounded-sm border border-line bg-panel2 px-1.5 text-xs"
            >
              <option value="">
                {loadingChannels ? "Loading…" : channels.length === 0 ? "No channels" : "Select…"}
              </option>
              {channels.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.my_role})
                </option>
              ))}
            </select>
          </div>

          <nav className="flex-1 overflow-y-auto p-1.5">
            {nav.map((section) => (
              <div key={section.section} className="mb-2">
                <p className="px-2 py-1 text-2xs font-semibold uppercase tracking-wider text-muted/70">
                  {section.section}
                </p>
                {section.entries.map((v) => {
                  const idx = flatNav.findIndex((x) => x.id === v.id);
                  return (
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
                      <span className="ml-auto font-num text-2xs text-muted/60">⌘{idx + 1}</span>
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>

          <div className="border-t border-line p-1.5">
            <button
              onClick={() => setView("settings")}
              className={cn(
                "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-xs transition-colors",
                view === "settings"
                  ? "bg-accent/15 text-fg"
                  : "text-muted hover:bg-panel2 hover:text-fg",
              )}
            >
              <Settings className="h-3.5 w-3.5" />
              Settings
            </button>
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
          {selected === null && !isStaff ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
              <Radio className="h-8 w-8 text-muted/40" />
              <p className="max-w-72 text-xs leading-relaxed text-muted">
                You don&apos;t manage any channels yet. Create one to start streaming, or ask a
                channel owner to give you a streamer or moderator role.
              </p>
              <CreateChannelDialog
                onCreated={(id) => {
                  qc.invalidateQueries();
                  setSelectedId(id);
                  setView("overview");
                }}
              />
            </div>
          ) : view === "settings" ? (
            <SettingsView user={user} />
          ) : selected && (CHANNEL_VIEWS.some((v) => v.id === view) || view === "overview") ? (
            <>
              {view === "overview" && (
                <CreatorOverview channel={selected} onGoStream={() => setView("stream")} />
              )}
              {view === "stream" && <CreatorStream channel={selected} />}
              {view === "chat" && <ChatView communityId={selected.id} />}
              {view === "recordings" && <ChannelRecordingsView channel={selected} />}
              {view === "members" && <CreatorMembers channel={selected} />}
            </>
          ) : isStaff && PLATFORM_VIEWS.some((v) => v.id === view) ? (
            <>
              {view === "p-dashboard" && <DashboardView onNavigate={(v) => setView(v as ViewId)} />}
              {view === "p-streams" && <StreamsView />}
              {view === "p-communities" && <CommunitiesView />}
              {view === "p-users" && <UsersView />}
              {view === "p-recordings" && <RecordingsView />}
            </>
          ) : isStaff ? (
            <DashboardView onNavigate={(v) => setView(v as ViewId)} />
          ) : (
            <CreatorOverview channel={selected!} onGoStream={() => setView("stream")} />
          )}
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
          {selectedLive && <Badge tone="live">live · {selectedLive.viewers} viewers</Badge>}
          {updateUrl && (
            <a href={updateUrl} target="_blank" rel="noreferrer" title="New version available">
              <Badge tone="accent">update available ↑</Badge>
            </a>
          )}
          <button
            className="flex items-center gap-1 hover:text-fg"
            onClick={() => setHelpOpen(true)}
            title="Keyboard shortcuts (⌘/)"
          >
            <Keyboard className="h-3 w-3" /> shortcuts
          </button>
          <span>
            {user.email} · {user.system_role}
          </span>
        </div>
      </footer>

      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent title="Keyboard shortcuts">
          <div className="space-y-1.5">
            {SHORTCUTS.map(([keys, label]) => (
              <div key={keys} className="flex items-center justify-between text-xs">
                <span className="text-muted">{label}</span>
                <kbd className="rounded-xs border border-line bg-bg px-1.5 py-0.5 font-num">
                  {keys}
                </kbd>
              </div>
            ))}
            <div className="flex items-center justify-between border-t border-line pt-1.5 text-xs">
              <span className="text-muted">View rows for context menus</span>
              <kbd className="rounded-xs border border-line bg-bg px-1.5 py-0.5 font-num">
                right-click
              </kbd>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} actions={actions} />
    </div>
  );
}
