import { topbar, streamCard } from "../components.mjs";

const T = {
  amber: ["rgba(245,166,35,.14)", "#f5a623"],
  pink: ["rgba(214,122,177,.16)", "#d67ab1"],
  blue: ["rgba(90,169,230,.16)", "#5aa9e6"],
};

export default {
  w: 1440,
  h: 900,
  html: `${topbar({ active: "browse", notif: true })}
  <main style="max-width:880px;margin:0 auto;padding:72px 24px 0;text-align:left">
    <div class="eyebrow">Channel not found</div>
    <h1 class="h1" style="font-size:40px;line-height:44px;margin-top:8px">There's nothing at that address.</h1>
    <p class="muted" style="margin-top:12px;max-width:520px">The link may have a typo, or the channel was renamed or deleted by its owner. Try a search, or have a look at who is live right now.</p>
    <div style="display:flex;gap:8px;margin-top:24px"><div class="in" style="width:360px"><span class="subtle" style="flex:1">Search channels…</span></div><span class="btn primary" style="height:36px">Search</span><span class="btn secondary" style="height:36px">Browse everything</span></div>
    <div class="eyebrow" style="margin-top:56px">Live now</div>
    <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;margin-top:12px">
      ${streamCard({ kind: "radio", title: "Late night requests · open lines", channel: "latenight_radio", viewers: "1,402", tone: T.pink })}
      ${streamCard({ kind: "bench", title: "Restoring the 1974 radio, part 3", channel: "nila_workshop", viewers: "312", tone: T.amber })}
      ${streamCard({ kind: "code", title: "Writing a tiny HTTP server in Zig", channel: "dhaka_dev_chat", viewers: "276", tone: T.blue })}
    </div>
  </main>`,
};
