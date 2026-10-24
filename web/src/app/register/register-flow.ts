import { me, setSession } from "@/lib/api";
import type { Token, User } from "@/lib/types";

/** Store the register response tokens and hydrate the session cache. */
export async function adoptSessionAfterRegister(token: Token): Promise<User> {
  setSession({ access_token: token.access_token, refresh_token: token.refresh_token });
  return me();
}
