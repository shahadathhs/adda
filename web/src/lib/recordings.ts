/** A recording's display title, from its file name (`2026-10-24T18-30-00-title.mp4`). */
export function recordingTitle(name: string): string {
  const stem = name.replace(/\.[^.]+$/, "");
  const cleaned = stem
    .replace(/^\d{4}-\d{2}-\d{2}T?[\d-]*/, "")
    .replace(/[-_]+/g, " ")
    .trim();
  return cleaned || stem;
}
