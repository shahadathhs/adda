import { me, setSession } from "@adda/api-client";
import type { Token, User } from "@adda/types";

/** Store the register response tokens and hydrate the session cache. */
export async function adoptSessionAfterRegister(token: Token): Promise<User> {
  setSession({ access_token: token.access_token, refresh_token: token.refresh_token });
  return me();
}
