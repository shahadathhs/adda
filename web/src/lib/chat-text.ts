export type ChatToken =
  | { kind: "text"; value: string }
  | { kind: "mention"; value: string }
  | { kind: "emote"; name: string };

const PATTERN = /(@[A-Za-z0-9_]{3,50})|:([a-z0-9_]{2,24}):/g;

/**
 * Split a message into plain text, @mentions and `:emote:` references. A `:name:`
 * that is not one of the channel's emotes stays plain text, so removing an emote
 * renders it as the text it was typed as.
 */
export function tokenize(content: string, emotes: ReadonlySet<string>): ChatToken[] {
  const out: ChatToken[] = [];
  let last = 0;
  for (const m of content.matchAll(PATTERN)) {
    const at = m.index ?? 0;
    const piece = m[1] ? { kind: "mention" as const, value: m[1] } : emoteOrNull(m[2], emotes);
    if (!piece) continue;
    if (at > last) out.push({ kind: "text", value: content.slice(last, at) });
    out.push(piece);
    last = at + m[0].length;
  }
  if (last < content.length) out.push({ kind: "text", value: content.slice(last) });
  return out;
}

function emoteOrNull(name: string, emotes: ReadonlySet<string>): ChatToken | null {
  return emotes.has(name) ? { kind: "emote", name } : null;
}
