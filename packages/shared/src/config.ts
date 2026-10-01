/**
 * Runtime server configuration. Bundler-agnostic: env vars are read
 * defensively so this module works under Vite, Next.js, and Tauri alike.
 */

interface EnvLike {
  VITE_API_BASE_URL?: string;
  VITE_HLS_BASE_URL?: string;
  NEXT_PUBLIC_API_BASE_URL?: string;
  NEXT_PUBLIC_HLS_BASE_URL?: string;
}

// Bundler globals — Vite exposes import.meta.env, Next inlines process.env.
// Declared locally (not via @types/node) so browser-only packages typecheck.
declare const process: { env?: Record<string, string | undefined> } | undefined;

/**
 * Read build-time env defaults bundler-agnostically: Vite exposes
 * `import.meta.env.VITE_*`, Next inlines `process.env.NEXT_PUBLIC_*`.
 * These are only DEFAULTS — desktop apps override at runtime via
 * localStorage (setServerConfig).
 */
function readEnvDefaults(): { api?: string; hls?: string } {
  const viteEnv = (import.meta as unknown as { env?: EnvLike }).env;
  if (viteEnv?.VITE_API_BASE_URL) {
    return { api: viteEnv.VITE_API_BASE_URL, hls: viteEnv.VITE_HLS_BASE_URL };
  }
  const nextEnv = typeof process !== "undefined" ? (process.env ?? {}) : {};
  if (nextEnv.NEXT_PUBLIC_API_BASE_URL) {
    return {
      api: nextEnv.NEXT_PUBLIC_API_BASE_URL,
      hls: nextEnv.NEXT_PUBLIC_HLS_BASE_URL,
    };
  }
  return {};
}

const envDefaults = readEnvDefaults();
const DEFAULT_API_BASE_URL = envDefaults.api || "http://localhost:7001";
const DEFAULT_HLS_BASE_URL = envDefaults.hls || "http://localhost:8888";

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
