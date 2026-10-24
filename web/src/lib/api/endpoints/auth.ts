import type { Token, User } from "@/lib/types";
import { request } from "../client";

export const register = (data: {
  username: string;
  email: string;
  password: string;
  display_name: string;
}) =>
  request<Token>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const login = (data: { email: string; password: string }) =>
  request<Token>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const forgotPassword = (email: string) =>
  request<{ message: string }>("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });

export const resetPassword = (token: string, password: string) =>
  request<{ message: string }>("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, password }),
  });

export const me = () => request<User>("/api/auth/me");

export const logout = (refresh_token: string) =>
  request<{ message: string }>("/api/auth/logout", {
    method: "POST",
    body: JSON.stringify({ refresh_token }),
  });

export const updateProfile = (data: {
  username?: string;
  display_name?: string;
  avatar_url?: string | null;
  bio?: string | null;
}) =>
  request<User>("/api/auth/me", {
    method: "PATCH",
    body: JSON.stringify(data),
  });

export const changePassword = (current_password: string, new_password: string) =>
  request<{ message: string }>("/api/auth/change-password", {
    method: "POST",
    body: JSON.stringify({ current_password, new_password }),
  });
