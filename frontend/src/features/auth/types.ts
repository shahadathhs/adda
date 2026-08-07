export interface User {
  id: string;
  username: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  is_admin: boolean;
}

export interface Token {
  access_token: string;
  token_type: string;
  user: User;
}
