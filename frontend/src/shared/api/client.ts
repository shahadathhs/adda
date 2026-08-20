import { apiBaseUrl } from "@/shared/config";

const TOKEN_KEY = "adda_token";
const REFRESH_TOKEN_KEY = "adda_refresh_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export interface SessionTokens {
  access_token: string;
  refresh_token: string;
}

/** Persist both tokens from any login/refresh response. */
export function setSession(tokens: SessionTokens): void {
  setToken(tokens.access_token);
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token);
}

export function clearSession(): void {
  clearToken();
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

/** Decode a JWT payload (unverified) to read its expiry. */
function tokenExpiresInMs(token: string): number | null {
  try {
    const payload = JSON.parse(
      atob(token.split(".")[1]!.replace(/-/g, "+").replace(/_/g, "/")),
    ) as { exp?: number };
    return typeof payload.exp === "number" ? payload.exp * 1000 - Date.now() : null;
  } catch {
    return null;
  }
}

/** True when no token exists or it expires within the next 30s. */
export function isTokenExpired(): boolean {
  const token = getToken();
  if (!token) return true;
  const expiresInMs = tokenExpiresInMs(token);
  return expiresInMs === null || expiresInMs < 30_000;
}

let refreshPromise: Promise<boolean> | null = null;

/**
 * Exchange the stored refresh token for a new token pair (single-flight —
 * concurrent callers share one request). Returns true when a fresh access
 * token is available. On a hard rejection the session is cleared; network
 * errors keep the existing tokens so a later call can retry.
 */
export async function refreshSession(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const resp = await fetch(`${apiBaseUrl()}/api/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });
        if (!resp.ok) {
          clearSession();
          return false;
        }
        setSession((await resp.json()) as SessionTokens);
        return true;
      } catch {
        return false;
      } finally {
        refreshPromise = null;
      }
    })();
  }
  return refreshPromise;
}

/** Error thrown for any non-2xx response. Carries the HTTP status. */
export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/** Authenticated JSON fetch helper used by every feature api module. */
export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const doFetch = async (): Promise<Response> => {
    const token = getToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string> | undefined),
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    return fetch(`${apiBaseUrl()}${path}`, { ...options, headers });
  };

  let resp = await doFetch();

  // Transparently refresh once on 401 and retry (never for the refresh call
  // itself, which would loop).
  if (resp.status === 401 && getRefreshToken() && !path.startsWith("/api/auth/refresh")) {
    if (await refreshSession()) {
      resp = await doFetch();
    }
  }

  if (resp.status === 204) {
    return undefined as T;
  }
  if (!resp.ok) {
    let detail = resp.statusText;
    try {
      const body = await resp.json();
      detail = body.detail ?? detail;
    } catch {
      /* ignore */
    }
    throw new ApiError(detail, resp.status);
  }
  return resp.json() as Promise<T>;
}
