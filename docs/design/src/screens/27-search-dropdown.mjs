import { shell } from "../shells.mjs";
import { icons, avatar, live } from "../components.mjs";
import { homeBody } from "../home.mjs";
import { T } from "../data.mjs";

const row = (lead, t, s, tail = "", on = false) =>
  `<div class="r ${on ? "on" : ""}">${lead}<div style="flex:1;min-width:0"><div class="t">${t}</div><div class="s">${s}</div></div>${tail}</div>`;
const liveTail = (v) =>
  `<span style="display:inline-flex;align-items:center;gap:8px">${live()}<span class="num muted" style="font-size:12px">${v}</span></span>`;

const dd = `<div class="dd">
  <div class="grp">Channels</div>
  ${row(avatar("latenight_radio", 32, T.pink), "latenight_<mark>radio</mark>", "Late night requests · open lines", liveTail("1,402"), true)}
  ${row(avatar("nila_workshop", 32, T.amber), "nila_workshop", "Restoring the 1974 <mark>radio</mark>, part 3", liveTail("312"))}
  ${row(avatar("shortwave_sam", 32, T.blue), "shortwave_sam", "@shortwave_sam")}
  <div class="grp">Videos</div>
  ${row(`<div class="tile">${icons.clapper(16)}</div>`, "How a superhet <mark>radio</mark> works", "latenight_radio · video")}
  <div class="grp">Recordings</div>
  ${row(`<div class="tile">${icons.film(16)}</div>`, "Restoring the 1974 <mark>radio</mark>, part 2", "nila_workshop · Oct 11, 2026")}
  <div class="all">${icons.search(14)}<span>See all results for “radio”</span><span style="margin-left:auto">${icons.arrow(14)}</span></div>
</div>`;

export default {
  w: 1440,
  h: 900,
  html: shell({ active: "", notif: true, q: "radio", dd }, homeBody({ all: false }), { h: 900 }),
};
