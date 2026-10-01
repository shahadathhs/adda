import { useCallback, useEffect, useState } from "react";

/** Every place a tab can point. */
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

export const CHANNEL_VIEW_IDS = new Set<ViewId>([
  "overview",
  "stream",
  "chat",
  "recordings",
  "members",
]);

export const PLATFORM_VIEW_IDS = new Set<ViewId>([
  "p-dashboard",
  "p-streams",
  "p-communities",
  "p-users",
  "p-recordings",
]);

export const VIEW_LABELS: Record<ViewId, string> = {
  overview: "Overview",
  stream: "Stream",
  chat: "Chat",
  recordings: "Recordings",
  members: "Members",
  "p-dashboard": "Dashboard",
  "p-streams": "Streams",
  "p-communities": "Communities",
  "p-users": "Users",
  "p-recordings": "Recordings",
  settings: "Settings",
};

/** One workspace tab: what to show, for which channel. */
export interface Tab {
  id: string;
  view: ViewId;
  /** null = platform/settings views, or the "no channel selected" state. */
  channelId: string | null;
}

const STORAGE_KEY = "adda_console_tabs";
const DEFAULT_VIEW: ViewId = "overview";

interface TabsState {
  tabs: Tab[];
  activeId: string;
}

function freshTab(seed?: Partial<Tab>): Tab {
  return {
    id: crypto.randomUUID(),
    view: seed?.view ?? DEFAULT_VIEW,
    channelId: seed?.channelId ?? null,
  };
}

function initialState(): TabsState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as TabsState;
      const valid =
        Array.isArray(parsed.tabs) &&
        parsed.tabs.length > 0 &&
        parsed.tabs.every((t) => t.id && t.view in VIEW_LABELS) &&
        parsed.tabs.some((t) => t.id === parsed.activeId);
      if (valid) return parsed;
    }
  } catch {
    /* corrupted — fall through to a fresh workspace */
  }
  const tab = freshTab();
  return { tabs: [tab], activeId: tab.id };
}

/**
 * Chrome/Notion-style dynamic tabs. Tabs live entirely client-side, persist
 * across launches, and never drop below one.
 */
export function useTabs() {
  const [state, setState] = useState<TabsState>(initialState);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state]);

  const activate = useCallback((id: string) => {
    setState((s) => (s.activeId === id ? s : { ...s, activeId: id }));
  }, []);

  /** Navigate the given tab (sidebar clicks, palette, in-view jumps). */
  const update = useCallback((id: string, patch: Partial<Omit<Tab, "id">>) => {
    setState((s) => ({
      ...s,
      tabs: s.tabs.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    }));
  }, []);

  const newTab = useCallback((seed?: Partial<Tab>) => {
    const tab = freshTab(seed);
    setState((s) => ({ tabs: [...s.tabs, tab], activeId: tab.id }));
  }, []);

  const duplicate = useCallback((id: string) => {
    setState((s) => {
      const idx = s.tabs.findIndex((t) => t.id === id);
      if (idx === -1) return s;
      const clone = freshTab(s.tabs[idx]);
      const tabs = [...s.tabs];
      tabs.splice(idx + 1, 0, clone);
      return { tabs, activeId: clone.id };
    });
  }, []);

  const closeTab = useCallback((id: string) => {
    setState((s) => {
      if (s.tabs.length === 1) return s; // never zero tabs
      const idx = s.tabs.findIndex((t) => t.id === id);
      if (idx === -1) return s;
      const tabs = s.tabs.filter((t) => t.id !== id);
      const activeId = s.activeId === id ? (tabs[idx] ?? tabs[idx - 1]!).id : s.activeId;
      return { tabs, activeId };
    });
  }, []);

  const closeOthers = useCallback((id: string) => {
    setState((s) => ({ tabs: s.tabs.filter((t) => t.id === id), activeId: id }));
  }, []);

  const cycle = useCallback((dir: 1 | -1) => {
    setState((s) => {
      const idx = s.tabs.findIndex((t) => t.id === s.activeId);
      const next = (idx + dir + s.tabs.length) % s.tabs.length;
      return { ...s, activeId: s.tabs[next]!.id };
    });
  }, []);

  /**
   * Reconcile restored tabs with reality: drop dead channel references and
   * platform views the user can no longer access.
   */
  const sanitize = useCallback((validChannelIds: Set<string>, isStaff: boolean) => {
    setState((s) => {
      let changed = false;
      const tabs = s.tabs.map((t) => {
        let next = t;
        if (t.channelId && !validChannelIds.has(t.channelId)) {
          next = {
            ...next,
            channelId: null,
            view: CHANNEL_VIEW_IDS.has(next.view) ? "overview" : next.view,
          };
          changed = true;
        }
        if (!isStaff && PLATFORM_VIEW_IDS.has(next.view)) {
          next = { ...next, view: DEFAULT_VIEW };
          changed = true;
        }
        return next;
      });
      return changed ? { ...s, tabs } : s;
    });
  }, []);

  const active = state.tabs.find((t) => t.id === state.activeId) ?? state.tabs[0]!;

  return {
    tabs: state.tabs,
    activeId: active.id,
    active,
    activate,
    update,
    newTab,
    duplicate,
    closeTab,
    closeOthers,
    cycle,
    sanitize,
  };
}
