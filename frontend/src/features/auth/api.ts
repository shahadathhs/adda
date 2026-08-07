import { request } from "@/shared/api/client";
import type { Token, User } from "./types";

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

export const me = () => request<User>("/api/auth/me");
