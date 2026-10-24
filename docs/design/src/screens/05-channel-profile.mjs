import { topbar, avatar, icons, scene } from "../components.mjs";

const amber = ["rgba(245,166,35,.14)", "#f5a623"];
const T = [
  ["rgba(214,122,177,.16)", "#d67ab1"],
  ["rgba(90,169,230,.16)", "#5aa9e6"],
  ["rgba(47,191,113,.16)", "#2fbf71"],
  amber,
];
const f = (n, i, since, role) =>
  `<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--line)">${avatar(n, 32, T[i % 4])}<div style="flex:1"><div style="font-weight:500">${n} ${role ? `<span class="badge ${role}">${role}</span>` : ""}</div><div class="subtle" style="font-size:12px">follower since <span class="num">${since}</span></div></div></div>`;

export default {
  w: 1440,
  h: 900,
  html: `
  ${topbar({ active: "browse", notif: true })}
  <div style="height:844px;overflow:hidden">
    <div style="height:176px;position:relative;border-bottom:1px solid var(--line);background:#171b22"><div class="cover" style="opacity:.4">${scene("bench")}</div></div>
    <div style="max-width:1200px;margin:0 auto;padding:0 24px">
      <div style="display:flex;align-items:flex-end;gap:18px;margin-top:-36px;position:relative">
        <div style="border:4px solid var(--bg);border-radius:50%">${avatar("nila_workshop", 96, amber).replace("font-size:35px", "font-size:34px")}</div>
        <div style="flex:1;padding-bottom:6px"><div style="display:flex;align-items:center;gap:10px"><h1 class="h1">nila_workshop</h1><span class="badge owner">owner</span></div>
          <div class="muted" style="font-size:13px"><span class="num">4,812</span> followers · joined <span class="num">Mar 2025</span> · <span class="num">23</span> recordings</div></div>
        <div style="display:flex;gap:8px;padding-bottom:8px"><span class="btn secondary">${icons.bell(14)} Alerts on</span><span class="btn primary">${icons.heart(14)} Following</span></div>
      </div>
      <div class="tabs" style="margin-top:18px"><a class="on">About</a><a>Recordings</a><a>Followers</a></div>
      <div style="display:grid;grid-template-columns:minmax(0,1fr) 320px;gap:40px;margin-top:22px">
        <div>
          <div class="eyebrow">About</div>
          <p style="margin-top:8px;max-width:620px;color:var(--fg)">Slow repairs of old radios, record players and the odd tape deck. New stream most Sundays at 8 PM Dhaka time. Chai in hand, soldering iron hot. Be kind in chat, and ask anything about capacitors.</p>
          <div style="display:flex;gap:10px;margin-top:14px"><span class="pill on">${icons.link(12)} nilaworkshop.example</span><span class="pill">${icons.link(12)} Tape-deck notes</span></div>
          <div class="eyebrow" style="margin-top:32px">Announcements</div>
          <div style="margin-top:10px;display:flex;flex-direction:column;gap:10px">
            <div class="panel"><div class="subtle num" style="font-size:12px">Oct 22 · pinned</div><div style="margin-top:4px">Next Sunday: the dial lamp. Bring questions about incandescent vs LED replacements.</div></div>
            <div class="panel"><div class="subtle num" style="font-size:12px">Oct 09</div><div style="margin-top:4px">Moved the stream key; if OBS says "unauthorized", it's me, not you.</div></div>
            <div class="panel"><div class="subtle num" style="font-size:12px">Sep 28</div><div style="margin-top:4px">Thank you for 4,000 followers. The emote pack is live: type :chai: in chat.</div></div>
          </div>
        </div>
        <div>
          <div style="display:flex;justify-content:space-between;align-items:baseline"><div class="eyebrow">Followers</div><span class="tag num">4,812</span></div>
          <div style="margin-top:6px">${f("mehedi", 1, "Mar 2025", "mod")}${f("sadia", 2, "Apr 2025", "mod")}${f("tania_r", 0, "Oct 2026", "")}${f("imran", 2, "Jun 2025", "")}${f("joy_k", 1, "Aug 2025", "")}${f("rafi", 3, "Sep 2025", "")}</div>
          <div class="btn ghost" style="margin-top:8px;padding:0">View all followers</div>
        </div>
      </div>
    </div>
  </div>`,
};
