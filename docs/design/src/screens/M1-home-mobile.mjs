import { avatar, icons, scene, live, mobileBar } from "../components.mjs";

const T = {
  amber: ["rgba(245,166,35,.14)", "#f5a623"],
  pink: ["rgba(214,122,177,.16)", "#d67ab1"],
  green: ["rgba(47,191,113,.16)", "#2fbf71"],
  blue: ["rgba(90,169,230,.16)", "#5aa9e6"],
};
const ring = (n, tone, on) =>
  `<div style="display:flex;flex-direction:column;align-items:center;gap:6px;width:60px"><div style="padding:2px;border-radius:50%;border:2px solid ${on ? "var(--live)" : "var(--line)"}">${avatar(n, 44, tone)}</div><div style="font-size:11px;color:${on ? "var(--fg)" : "var(--fg-muted)"};max-width:60px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${n}</div></div>`;
const card = (kind, title, ch, v, tone) =>
  `<div class="card"><div class="thumb">${scene(kind)}<div class="tl">${live()}</div><div class="bl"><span style="display:inline-flex">${icons.eye(12)}</span><span class="num">${v}</span></div></div><div class="cardmeta">${avatar(ch, 36, tone)}<div style="min-width:0"><div class="t">${title}</div><div class="s">${ch}</div></div></div></div>`;

export default {
  w: 390,
  h: 844,
  html: `${mobileBar({ active: "" })}
  <div style="padding:16px;height:752px;overflow:hidden">
    <div class="eyebrow" style="margin:0 0 10px">Following</div>
    <div style="display:flex;gap:6px">${ring("nila_workshop", T.amber, true)}${ring("latenight_radio", T.pink, true)}${ring("kodomo_chess", T.green, true)}${ring("tuesday-tabletop", T.amber, false)}${ring("dhaka_dev", T.blue, false)}</div>
    <div style="display:flex;justify-content:space-between;align-items:baseline;margin:22px 0 12px"><h2 class="h2">Live now <span class="num muted" style="font-size:14px;font-weight:500">6</span></h2></div>
    <div style="display:flex;flex-direction:column;gap:14px">
      ${card("bench", "Restoring the 1974 radio, part 3", "nila_workshop", "312", T.amber)}
      ${card("radio", "Late night requests · open lines", "latenight_radio", "1,402", T.pink)}
    </div>
  </div>`,
};
