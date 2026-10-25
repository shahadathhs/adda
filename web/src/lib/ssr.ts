import "server-only";

/**
 * Server-side API origin for RSC fetching. Inside docker-compose the backend
 * is reachable at http://backend:7001; locally it's localhost.
 */
export const SSR_API_URL = process.env.API_SSR_URL ?? "http://localhost:7001";

export async function ssrFetch<T>(path: string, revalidate = 10): Promise<T | null> {
  try {
    const res = await fetch(`${SSR_API_URL}${path}`, {
      next: { revalidate },
      headers: { accept: "application/json" },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    // Backend down / cold start: render the shell, client takes over.
    return null;
  }
}
