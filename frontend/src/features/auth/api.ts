import { request } from "@/shared/api/client";
import type { LoginResponse, Token, User } from "./types";

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
  request<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const verify2faLogin = (temp_token: string, code: string) =>
  request<Token>("/api/auth/login/verify-2fa", {
    method: "POST",
    body: JSON.stringify({ temp_token, code }),
  });

export const googleLogin = (id_token: string) =>
  request<Token>("/api/auth/google", {
    method: "POST",
    body: JSON.stringify({ id_token }),
  });

export const requestOtp = (email: string) =>
  request<{ message: string }>("/api/auth/otp/request", {
    method: "POST",
    body: JSON.stringify({ email }),
  });

export const verifyOtp = (email: string, code: string) =>
  request<Token>("/api/auth/otp/verify", {
    method: "POST",
    body: JSON.stringify({ email, code }),
  });

export const resetPassword = (token: string, password: string) =>
  request<{ message: string }>("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, password }),
  });

export const me = () => request<User>("/api/auth/me");

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

export const setPassword = (new_password: string) =>
  request<{ message: string }>("/api/auth/set-password", {
    method: "POST",
    body: JSON.stringify({ new_password }),
  });

export const enable2fa = () =>
  request<{ message: string }>("/api/auth/2fa/enable", { method: "POST" });

export const enable2faVerify = (code: string) =>
  request<{ message: string }>("/api/auth/2fa/enable/verify", {
    method: "POST",
    body: JSON.stringify({ code }),
  });

export const disable2fa = (password: string) =>
  request<{ message: string }>("/api/auth/2fa/disable", {
    method: "POST",
    body: JSON.stringify({ password }),
  });

export const linkGoogle = (id_token: string) =>
  request<User>("/api/auth/google/link", {
    method: "POST",
    body: JSON.stringify({ id_token }),
  });
