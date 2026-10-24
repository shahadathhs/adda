export type IdentityMode = "named" | "anonymous";

export interface User {
  id: string;
  username: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  system_role: "user" | "admin" | "superadmin";
  identity_mode: IdentityMode;
}

export interface Token {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}
