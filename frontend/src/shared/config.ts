const DEFAULT_API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:7001";
const DEFAULT_HLS_BASE_URL = import.meta.env.VITE_HLS_BASE_URL || "http://localhost:8888";

const SERVER_CONFIG_KEY = "adda_server_config";

export interface ServerConfig {
  /** Backend origin, e.g. https://adda.example.com:7001 */
  api: string;
  /** HLS (mediamtx) origin used for live playback. */
  hls: string;
}

/** True when running inside the Tauri desktop shell. */
export const isDesktopApp = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

function stripTrailingSlash(url: string): string {
  return url.replace(/\/+$/, "");
}

/** Default HLS origin: same host as the API server, mediamtx HLS port. */
export function deriveHlsBase(api: string): string {
  try {
    const u = new URL(api);
    return `${u.protocol}//${u.hostname}:8888`;
  } catch {
    return DEFAULT_HLS_BASE_URL;
  }
}

function readStored(): Partial<ServerConfig> | null {
  try {
    const raw = localStorage.getItem(SERVER_CONFIG_KEY);
    return raw ? (JSON.parse(raw) as Partial<ServerConfig>) : null;
  } catch {
    return null;
  }
}

/** The active server config: user override if set, else build-time defaults. */
export function getServerConfig(): ServerConfig {
  const stored = readStored();
  if (stored?.api) {
    return {
      api: stripTrailingSlash(stored.api),
      hls: stripTrailingSlash(stored.hls || deriveHlsBase(stored.api)),
    };
  }
  return { api: DEFAULT_API_BASE_URL, hls: DEFAULT_HLS_BASE_URL };
}

/** Persist a server override (desktop app / remote deployments). */
export function setServerConfig(api: string, hls?: string): void {
  const normalizedApi = stripTrailingSlash(api);
  localStorage.setItem(
    SERVER_CONFIG_KEY,
    JSON.stringify({
      api: normalizedApi,
      hls: stripTrailingSlash(hls || deriveHlsBase(normalizedApi)),
    }),
  );
}

export function clearServerConfig(): void {
  localStorage.removeItem(SERVER_CONFIG_KEY);
}

export function hasServerConfig(): boolean {
  return readStored()?.api !== undefined;
}

/** Backend API origin (call at request time — can change at runtime). */
export function apiBaseUrl(): string {
  return getServerConfig().api;
}

/** WebSocket origin, derived from the API origin (http→ws, https→wss). */
export function wsBaseUrl(): string {
  return apiBaseUrl().replace(/^http/, "ws");
}

/** HLS (mediamtx) origin for live playback. */
export function hlsBaseUrl(): string {
  return getServerConfig().hls;
}
