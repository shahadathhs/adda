import { topbar, avatar, icons, scene, msg, emote } from "../components.mjs";

const amber = ["rgba(245,166,35,.14)", "#f5a623"];

export default {
  w: 1440,
  h: 900,
  html: `${topbar({ active: "browse", notif: true })}
  <div style="display:flex;height:844px">
    <main style="flex:1;min-width:0;padding:20px 24px;overflow:hidden">
      <div class="card" style="border-radius:8px"><div class="thumb" style="aspect-ratio:16/9;border-bottom:0">
        <div style="position:absolute;inset:0;opacity:.08">${scene("bench")}</div>
        <div style="position:absolute;inset:0;background:rgba(12,13,16,.8);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;text-align:center">
          <span class="offline" style="font-size:12px">Stream ended</span>
          <div class="h1">Thanks for watching</div>
          <div class="muted">nila_workshop streamed for <span class="num">3h 41m</span> · peak <span class="num">412</span> viewers</div>
          <div style="width:360px;margin-top:10px;text-align:left"><div class="row" style="font-size:13px;margin-bottom:6px"><span style="flex:1">Saving the recording…</span><span class="num muted">64%</span></div>
            <div style="height:6px;border-radius:3px;background:var(--input)"><div style="width:64%;height:100%;border-radius:3px;background:var(--accent)"></div></div>
            <div class="subtle" style="font-size:12px;margin-top:6px">Ready in a few minutes. You can leave this page; we'll add it to Recordings.</div></div>
          <div style="display:flex;gap:8px;margin-top:8px"><span class="btn primary">${icons.heart(14)} Following</span><span class="btn secondary">${icons.bell(14)} Alerts on</span></div>
        </div></div></div>
      <div style="display:flex;align-items:flex-start;gap:14px;margin-top:16px">${avatar("nila_workshop", 48, amber)}<div style="flex:1"><h1 class="h2" style="line-height:26px">Sunday build: restoring the 1974 radio, part 3</h1><div class="muted" style="font-size:13px;margin-top:2px"><b style="color:var(--fg);font-weight:600">nila_workshop</b> · <span class="num">4,812</span> followers</div></div></div>
      <div class="tabs" style="margin-top:14px"><a class="on">About</a><a>Recordings <span class="num subtle" style="font-size:12px">23</span></a><a>Followers</a></div>
    </main>
    <aside class="chat" style="width:340px;flex-shrink:0">
      <div class="head"><span>Chat</span><span class="tag">Stream ended</span></div>
      <div class="msgs">
        ${msg({ user: "mehedi", color: "#5aa9e6", text: `great one today ${emote("lgtm")}`, badges: ["fol"] })}
        ${msg({ user: "tania_r", color: "#d67ab1", text: `thank you for the chai tip ${emote("chai")}` })}
        ${msg({ user: "nila_workshop", color: "#f5a623", text: "See you next Sunday, dial lamp is up first.", badges: ["owner"] })}
        <div style="text-align:center;color:var(--fg-subtle);font-size:12px;border-top:1px solid var(--line);padding-top:10px;margin-top:2px">The stream ended · chat stays open for a while</div>
      </div>
      <div class="composer"><div class="field"><span style="flex:1;font-size:13px">Say something to nila_workshop…</span>${icons.smile(18)}${icons.send(18)}</div></div>
    </aside>
  </div>`,
};
