export interface User {
  id: string;
  username: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  system_role: "user" | "admin" | "superadmin";
  /** True when the account has a password set (OAuth-only accounts don't). */
  has_password: boolean;
  /** Google subject id when the account is linked to Google OAuth. */
  google_id: string | null;
  /** Email-based two-factor authentication. */
  two_factor_enabled: boolean;
}

export interface Token {
  access_token: string;
  token_type: string;
  user: User;
}

/** Returned by `/auth/login` when the account has 2FA enabled. */
export interface TwoFactorChallenge {
  requires_2fa: true;
  temp_token: string;
}

/** A login attempt resolves to either a session token or a 2FA challenge. */
export type LoginResponse = Token | TwoFactorChallenge;

export function isToken(res: LoginResponse): res is Token {
  return (res as Token).access_token !== undefined;
}
