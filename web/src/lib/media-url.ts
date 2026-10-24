import { apiBaseUrl } from "@/lib/config";

/** Uploaded images are served by the API as relative paths; external URLs pass through. */
export const mediaUrl = (url: string | null | undefined): string | null =>
  !url ? null : url.startsWith("/") ? `${apiBaseUrl()}${url}` : url;
