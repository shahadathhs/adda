/** A stable avatar tone class (`tone-0`..`tone-3`) for a name. */
export function toneClass(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  return `tone-${Math.abs(hash) % 4}`;
}
