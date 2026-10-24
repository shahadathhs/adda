import { topbar, avatar, live, icons, scene } from "../components.mjs";

const T = {
  amber: ["rgba(245,166,35,.14)", "#f5a623"],
  pink: ["rgba(214,122,177,.16)", "#d67ab1"],
  blue: ["rgba(90,169,230,.16)", "#5aa9e6"],
  green: ["rgba(47,191,113,.16)", "#2fbf71"],
};
const ch = (
  name,
  kind,
  tone,
  followers,
  status,
  line,
) => `<div class="card"><div class="thumb">${scene(kind)}<div class="tl">${status === "live" ? live() : '<span class="offline">Offline</span>'}</div></div>
  <div class="cardmeta">${avatar(name, 36, tone)}<div style="min-width:0;flex:1"><div class="t">${name}</div><div class="s">${line}</div></div><div class="subtle num" style="font-size:12px;white-space:nowrap">${followers}</div></div></div>`;

export default {
  w: 1440,
  h: 900,
  html: `
  <header class="topbar"><div class="brand">${icons.radio(20)}<span>adda</span></div><nav class="nav" style="display:flex"><a>Following</a><a class="on">Browse</a></nav>
    <div class="search" style="border-color:var(--accent);outline:2px solid rgba(245,166,35,.35)">${icons.search(16)}<span style="color:var(--fg)">radio</span></div>
    <div class="right"><div class="iconbtn">${icons.bell(18)}</div>${avatar("Rafi Ahmed", 30)}</div></header>
  <main style="padding:24px 32px;height:844px;overflow:hidden">
    <div style="display:flex;align-items:baseline;justify-content:space-between">
      <div><div class="eyebrow">Search</div><h1 class="h1" style="margin-top:4px">Channels matching “radio”</h1><div class="muted" style="margin-top:4px;font-size:13px"><span class="num">5</span> channels · <span class="num">2</span> live now</div></div>
      <div class="seg"><span class="on">All</span><span>Live</span><span>Following</span></div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px;margin-top:24px">
      ${ch("latenight_radio", "radio", T.pink, "12.9k", "live", "Late night requests · open lines")}
      ${ch("nila_workshop", "bench", T.amber, "4.8k", "live", "Restoring the 1974 radio, part 3")}
      ${ch("shortwave_sam", "wave", T.blue, "2.1k", "off", "Last live 6 days ago")}
      ${ch("ham_hour_bd", "radio", T.green, "860", "off", "Last live 2 weeks ago")}
      ${ch("radio_kolkata_archive", "wave", T.pink, "412", "off", "Last live 3 weeks ago")}
    </div>
    <div class="panel" style="margin-top:32px;display:flex;align-items:center;gap:12px;max-width:520px"><span class="muted">Not here?</span><span style="color:var(--accent)">Search recordings for “radio”</span></div>
  </main>`,
};
