import { topbar, avatar, icons, scene, streamCard } from "../components.mjs";

const amber = ["rgba(245,166,35,.14)", "#f5a623"];
const rec = (kind, title, dur, meta) =>
  `<div class="card"><div class="thumb">${scene(kind)}<div class="tl"><span class="offline">Recording</span></div><div class="br num">${dur}</div></div><div style="padding:10px 12px 12px"><div style="font-weight:600">${title}</div><div class="muted" style="font-size:13px"><span class="num">${meta}</span></div></div></div>`;

export default {
  w: 1440,
  h: 900,
  html: `
  ${topbar({ active: "browse", notif: true })}
  <div style="display:flex;height:844px">
    <main style="flex:1;min-width:0;padding:24px 24px 0;overflow:hidden">
      <div class="card" style="position:relative;border-radius:8px">
        <div class="thumb" style="aspect-ratio:16/6.4;border-bottom:0">
          <div style="position:absolute;inset:0;opacity:.18">${scene("bench")}</div>
          <div style="position:absolute;inset:0;background:rgba(12,13,16,.8);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;text-align:center">
            <span class="offline" style="font-size:12px">Offline</span>
            <div class="h1">nila_workshop is offline</div>
            <div class="muted">Last streamed <span class="num">2 days ago</span> · <span class="num">3h 41m</span></div>
            <div style="display:flex;gap:8px;margin-top:6px"><span class="btn primary">${icons.heart(14)} Following</span><span class="btn secondary">${icons.bell(14)} Alerts on</span><span class="btn secondary">${icons.play(14)} Watch the last stream</span></div>
          </div>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:14px;margin-top:18px">
        ${avatar("nila_workshop", 40, amber)}
        <div style="flex:1"><div class="h3">nila_workshop</div><div class="muted" style="font-size:13px"><span class="num">4,812</span> followers</div></div>
      </div>
      <div class="tabs" style="margin-top:14px"><a>About</a><a class="on">Recordings <span class="num subtle" style="font-size:12px">23</span></a><a>Followers</a></div>
      <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;margin-top:16px">
        ${rec("bench", "Sunday build: the stack", "2:14:09", "3 days ago · 1,204 views")}
        ${rec("bench", "Restoring the 1974 radio, part 2", "3:02:51", "10 days ago · 2,880 views")}
        ${rec("radio", "Tape deck teardown", "1:48:20", "17 days ago · 940 views")}
      </div>
    </main>
    <aside style="width:340px;flex-shrink:0;border-left:1px solid var(--line);padding:24px 20px;display:flex;flex-direction:column;gap:20px">
      <div><div class="eyebrow">About</div><p class="muted" style="margin-top:8px;font-size:13px">Slow repairs of old radios, record players and the odd tape deck. New stream most Sundays.</p>
        <div style="display:flex;flex-direction:column;gap:6px;margin-top:10px;font-size:13px;color:var(--accent)"><span style="display:flex;gap:6px">${icons.link(14)} nilaworkshop.example</span></div></div>
      <div class="sep" style="margin:0"></div>
      <div><div class="eyebrow">Announcements</div>
        <div class="panel" style="margin-top:10px;padding:12px"><div class="subtle num" style="font-size:12px">Oct 22</div><div style="margin-top:4px;font-size:13px">Next Sunday: the dial lamp. Bring questions about incandescent vs LED replacements.</div></div>
        <div class="panel" style="margin-top:8px;padding:12px"><div class="subtle num" style="font-size:12px">Oct 09</div><div style="margin-top:4px;font-size:13px">Moved the stream key; if OBS says "unauthorized", it's me, not you.</div></div>
      </div>
    </aside>
  </div>`,
};
