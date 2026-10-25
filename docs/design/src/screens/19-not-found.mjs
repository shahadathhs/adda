import { shell } from "../shells.mjs";
import { streamCard } from "../components.mjs";
import { liveNow } from "../data.mjs";

export default {
  w: 1440,
  h: 960,
  html: shell(
    { active: "", notif: true },
    `<div class="col"><div style="max-width:880px;margin:0 auto;padding-top:44px">
    <div class="eyebrow">Channel not found</div>
    <h1 class="h1" style="font-size:40px;line-height:44px;margin-top:8px">There's nothing at that address.</h1>
    <p class="muted" style="margin-top:12px;max-width:520px">The link may have a typo, or the channel was renamed or deleted by its owner. Try a search, or have a look at who is live right now.</p>
    <div style="display:flex;gap:8px;margin-top:24px"><div class="in" style="width:360px"><span class="subtle" style="flex:1">Search channels…</span></div><span class="btn primary" style="height:36px">Search</span><span class="btn secondary" style="height:36px">Browse channels</span></div>
    <div class="eyebrow" style="margin-top:40px">Live now</div>
    <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;margin-top:12px">
      ${liveNow
        .slice(0, 3)
        .map((c) =>
          streamCard({
            kind: c.kind,
            title: c.title,
            channel: c.name,
            viewers: c.viewers,
            tone: c.tone,
          }),
        )
        .join("")}
    </div></div></div>`,
    { h: 960, footer: true },
  ),
};
