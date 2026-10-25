import { shell } from "../shells.mjs";
import { avatar, icons, scene } from "../components.mjs";
import { T, videos } from "../data.mjs";

const mini = (v) =>
  `<div style="display:flex;gap:12px"><div class="thumb" style="width:168px;flex-shrink:0;border:1px solid var(--line);border-radius:6px"><div class="br num" style="right:6px;bottom:6px;font-size:11px">${v.dur}</div>${scene(v.kind)}</div><div style="min-width:0"><div style="font-weight:600;font-size:13px;line-height:18px">${v.title}</div><div class="muted" style="font-size:12px;margin-top:4px">${v.channel} · ${v.date}</div></div></div>`;

export default {
  w: 1440,
  h: 900,
  html: shell(
    { active: "videos", notif: true },
    `<div class="col" style="display:grid;grid-template-columns:minmax(0,1fr) 360px;gap:32px;padding-top:24px">
      <main>
        <div class="card" style="border-radius:8px;background:#000">
          <div class="thumb" style="aspect-ratio:16/9;border-bottom:0;background:#000">${scene("bench")}
            <div style="position:absolute;left:0;right:0;bottom:0;background:rgba(0,0,0,.72);padding:10px 14px 12px">
              <div style="position:relative;height:6px;border-radius:3px;background:var(--input);margin-bottom:10px"><div style="position:absolute;inset:0 auto 0 0;width:24%;background:var(--accent);border-radius:3px"></div><div style="position:absolute;left:24%;top:-4px;width:14px;height:14px;border-radius:50%;background:var(--accent);margin-left:-7px"></div></div>
              <div style="display:flex;align-items:center;gap:14px">${icons.play(18)}${icons.vol(18)}<span class="num" style="font-size:12px;color:var(--fg-muted)">00:44 / 03:03</span><span style="flex:1"></span>${icons.full(18)}</div>
            </div>
          </div>
        </div>
        <h1 class="h1" style="margin-top:18px;font-size:24px;line-height:30px">Dial lamp swap, start to finish</h1>
        <div style="display:flex;align-items:center;gap:12px;margin-top:12px">${avatar("nila_workshop", 40, T.amber)}<div><div style="font-weight:600">nila_workshop</div><div class="muted num" style="font-size:13px">October 24, 2026 · 3:03 · 360p · 310 KB</div></div></div>
        <div class="panel" style="margin-top:16px">
          <p class="muted" style="font-size:13px;max-width:640px">Replacing a burnt-out dial lamp on the 1974 set without lifting the chassis. Bulb type, the little spring clip, and the one screw that always hides. Parts list is in the channel's About tab.</p>
        </div>
      </main>
      <aside>
        <h2 class="h3">More from nila_workshop</h2>
        <div style="display:flex;flex-direction:column;gap:14px;margin-top:14px">
          ${[videos[6], { ...videos[0], title: "Restoring the 1974 radio: the intro", dur: "04:12", date: "Sep 14, 2026" }, { ...videos[6], title: "Soldering for the nervous", dur: "09:50", kind: "radio", date: "Aug 30, 2026" }].map(mini).join("")}
        </div>
      </aside>
    </div>`,
    { h: 900 },
  ),
};
