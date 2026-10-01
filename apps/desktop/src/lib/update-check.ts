/** One-shot check against GitHub releases for a newer console build. */

const REPO = "shahadathhs/adda";

export interface UpdateInfo {
  current: string;
  latest: string | null;
  url: string | null;
}

export async function checkForUpdate(current: string): Promise<UpdateInfo | null> {
  try {
    const res = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, {
      headers: { accept: "application/vnd.github+json" },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { tag_name?: string; html_url?: string };
    if (!data.tag_name) return null;
    return {
      current,
      latest: data.tag_name.replace(/^v/, ""),
      url: data.html_url ?? null,
    };
  } catch {
    return null;
  }
}

export function isNewer(latest: string, current: string): boolean {
  const l = latest.split(".").map(Number);
  const c = current.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    if ((l[i] ?? 0) > (c[i] ?? 0)) return true;
    if ((l[i] ?? 0) < (c[i] ?? 0)) return false;
  }
  return false;
}
