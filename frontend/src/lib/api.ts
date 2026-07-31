import { API_BASE_URL } from "../config";
import type { Community, Token, User } from "../types";

const TOKEN_KEY = "adda_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const resp = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });

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
    throw new Error(detail);
  }
  return resp.json() as Promise<T>;
}

// ── Auth ──
export const api = {
  register: (data: {
    username: string;
    email: string;
    password: string;
    display_name: string;
  }) => request<Token>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  }),

  login: (data: { email: string; password: string }) =>
    request<Token>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  me: () => request<User>("/api/auth/me"),

  // ── Communities ──
  listCommunities: () => request<Community[]>("/api/communities"),
  getCommunity: (id: string) => request<Community>(`/api/communities/${id}`),
  createCommunity: (data: Partial<Community> & { name: string; slug: string }) =>
    request<Community>("/api/communities", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // ── Membership ──
  joinCommunity: (id: string) =>
    request<User>(`/api/communities/${id}/members`, { method: "POST" }),
  leaveCommunity: (id: string) =>
    request<void>(`/api/communities/${id}/members`, { method: "DELETE" }),

  // ── Streaming ──
  streamStatus: (id: string) =>
    request<{ is_live: boolean; hls_url: string; rtmp_ingest_url: string }>(
      `/api/streaming/communities/${id}/status`
    ),
};
