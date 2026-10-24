import type { StreamCredentials } from "@/lib/types";

/** OBS wants a server and a key that it joins with "/"; ours are split at the channel path. */
export function splitCredentials(c: StreamCredentials): { server: string; key: string } {
  const at = c.stream_url.indexOf("/community/");
  if (at === -1) return { server: c.stream_url, key: "" };
  return {
    server: c.stream_url.slice(0, at + "/community".length),
    key: c.stream_url.slice(at + "/community/".length),
  };
}
