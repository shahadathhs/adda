// Shared building blocks for the concept renders. Plain functions → HTML strings.

const ic = (d, s = 16) =>
  `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;

export const icons = {
  radio: (s) =>
    ic(
      '<path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9"/><path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5"/><circle cx="12" cy="12" r="2"/><path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5"/><path d="M19.1 4.9C23 8.8 23 15.1 19.1 19"/>',
      s,
    ),
  search: (s) => ic('<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>', s),
  bell: (s) =>
    ic(
      '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
      s,
    ),
  eye: (s) =>
    ic(
      '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
      s,
    ),
  heart: (s) =>
    ic(
      '<path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7Z"/>',
      s,
    ),
  send: (s) => ic('<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>', s),
  smile: (s) =>
    ic(
      '<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><path d="M9 9h.01"/><path d="M15 9h.01"/>',
      s,
    ),
  pin: (s) =>
    ic(
      '<path d="M12 17v5"/><path d="M9 10.8a2 2 0 0 1-1.1 1.8l-1.8.9A2 2 0 0 0 5 15.2V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.8a2 2 0 0 0-1.1-1.8l-1.8-.9a2 2 0 0 1-1.1-1.8V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1Z"/>',
      s,
    ),
  chart: (s) =>
    ic('<path d="M3 3v18h18"/><path d="M7 16V9"/><path d="M12 16V5"/><path d="M17 16v-4"/>', s),
  reply: (s) => ic('<path d="M9 17 4 12l5-5"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/>', s),
  play: (s) => ic('<path d="M6 3l14 9-14 9Z" fill="currentColor"/>', s),
  vol: (s) => ic('<path d="M11 5 6 9H2v6h4l5 4Z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/>', s),
  full: (s) =>
    ic(
      '<path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>',
      s,
    ),
  users: (s) =>
    ic(
      '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9"/><path d="M16 3.1a4 4 0 0 1 0 7.8"/>',
      s,
    ),
  link: (s) =>
    ic(
      '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
      s,
    ),
  eyeoff: (s) =>
    ic(
      '<path d="M9.9 4.2A10 10 0 0 1 12 4c7 0 10 8 10 8a13 13 0 0 1-1.7 2.7"/><path d="M6.6 6.6A13 13 0 0 0 2 12s3 8 10 8a9.7 9.7 0 0 0 5.4-1.6"/><path d="m2 2 20 20"/>',
      s,
    ),
  lock: (s) =>
    ic('<rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>', s),
  copy: (s) =>
    ic(
      '<rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
      s,
    ),
  check: (s) => ic('<path d="M20 6 9 17l-5-5"/>', s),
  mic: (s) =>
    ic(
      '<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/>',
      s,
    ),
  film: (s) =>
    ic(
      '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 3v18"/><path d="M3 7.5h4"/><path d="M3 12h18"/><path d="M3 16.5h4"/><path d="M17 3v18"/><path d="M17 7.5h4"/><path d="M17 16.5h4"/>',
      s,
    ),
  clapper: (s) =>
    ic(
      '<path d="m4 11 16-6.5V8L4 11Z"/><path d="M4 11h16v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1Z"/><path d="m8.5 8.8-2-3.6"/><path d="m13 7-2-3.6"/>',
      s,
    ),
  upload: (s) =>
    ic(
      '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5"/><path d="M12 3v12"/>',
      s,
    ),
  chevd: (s) => ic('<path d="m6 9 6 6 6-6"/>', s),
  chevl: (s) => ic('<path d="m15 18-6-6 6-6"/>', s),
  chevr: (s) => ic('<path d="m9 18 6-6-6-6"/>', s),
  arrow: (s) => ic('<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>', s),
  x: (s) => ic('<path d="M18 6 6 18"/><path d="m6 6 12 12"/>', s),
  msg: (s) => ic('<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z"/>', s),
};

const HUES = ["#171b22", "#1a1d24", "#16191f", "#1b1e26"];

/** Flat, tonal stream "frames". Real captures replace these in the product. */
export function scene(kind, w = 640, h = 360) {
  const c = {
    chess: () => {
      let s = "";
      for (let y = 0; y < 8; y++)
        for (let x = 0; x < 8; x++)
          if ((x + y) % 2)
            s += `<rect x="${200 + x * 30}" y="${60 + y * 30}" width="30" height="30" fill="#2b3040"/>`;
      return `<rect width="640" height="360" fill="#14171d"/><rect x="200" y="60" width="240" height="240" fill="#202534"/>${s}<circle cx="335" cy="165" r="11" fill="#f5a623"/><rect x="326" y="176" width="18" height="30" rx="3" fill="#f5a623"/><circle cx="245" cy="105" r="10" fill="#9aa1af"/><circle cx="395" cy="255" r="10" fill="#9aa1af"/>`;
    },
    code: () => {
      const rows = [
        [40, 120],
        [64, 220],
        [64, 160],
        [88, 260],
        [88, 90],
        [64, 200],
        [40, 140],
        [40, 100],
        [64, 180],
        [88, 230],
        [64, 120],
        [40, 200],
      ];
      return `<rect width="640" height="360" fill="#13161c"/>${rows.map(([x, w], i) => `<rect x="${60 + x}" y="${50 + i * 24}" width="${w}" height="8" rx="2" fill="${i % 4 === 0 ? "#f5a623" : i % 3 === 0 ? "#4cc38a" : "#3a4152"}"/>`).join("")}<rect x="420" y="40" width="190" height="280" rx="6" fill="#1b1f27"/><rect x="436" y="60" width="120" height="8" rx="2" fill="#5aa9e6"/><rect x="436" y="82" width="150" height="8" rx="2" fill="#3a4152"/><rect x="436" y="104" width="90" height="8" rx="2" fill="#3a4152"/>`;
    },
    wave: () =>
      `<rect width="640" height="360" fill="#15131a"/>${Array.from({ length: 36 }, (_, i) => {
        const hh = 20 + Math.abs(Math.sin(i * 0.6) * 90) + (i % 5) * 8;
        return `<rect x="${60 + i * 15}" y="${180 - hh / 2}" width="9" height="${hh}" rx="2" fill="${i % 7 === 0 ? "#f5a623" : "#d67ab1"}" opacity="${i % 7 === 0 ? 1 : 0.8}"/>`;
      }).join("")}`,
    bench: () =>
      `<rect width="640" height="360" fill="#16181c"/><rect x="40" y="230" width="560" height="14" fill="#2a2e38"/><rect x="90" y="244" width="12" height="90" fill="#222630"/><rect x="540" y="244" width="12" height="90" fill="#222630"/><rect x="130" y="150" width="110" height="80" rx="4" fill="#2f3544"/><circle cx="330" cy="190" r="40" fill="#f5a623" opacity="0.9"/><rect x="400" y="170" width="120" height="60" rx="4" fill="#262b37"/><rect x="420" y="80" width="6" height="90" fill="#3a4152"/>`,
    dice: () =>
      `<rect width="640" height="360" fill="#171618"/><polygon points="320,60 390,100 390,180 320,220 250,180 250,100" fill="#2d2a33" stroke="#4a4552" stroke-width="3"/><polygon points="150,170 200,200 200,250 150,280 100,250 100,200" fill="#26252c" stroke="#4a4552" stroke-width="3"/><polygon points="500,170 550,200 550,250 500,280 450,250 450,200" fill="#f5a623" opacity="0.85"/><circle cx="320" cy="140" r="12" fill="#9aa1af"/>`,
    radio: () =>
      `<rect width="640" height="360" fill="#131518"/><circle cx="320" cy="180" r="110" fill="none" stroke="#2a2e38" stroke-width="2"/><circle cx="320" cy="180" r="76" fill="none" stroke="#2a2e38" stroke-width="2"/><circle cx="320" cy="180" r="42" fill="#1d2027"/><circle cx="320" cy="180" r="12" fill="#f5a623"/><rect x="80" y="300" width="480" height="6" rx="3" fill="#232730"/><rect x="80" y="300" width="300" height="6" rx="3" fill="#f5a623" opacity="0.8"/>`,
  }[kind]();
  return `<svg class="scene" viewBox="0 0 640 360" preserveAspectRatio="xMidYMid slice" width="${w}" height="${h}">${c}</svg>`;
}

export const avatar = (name, size = 36, tone) =>
  `<div class="avatar" style="width:${size}px;height:${size}px;font-size:${Math.round(size * 0.36)}px${tone ? `;background:${tone[0]};color:${tone[1]}` : ""}">${name
    .split(/[\s_-]+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()}</div>`;

export const live = () => `<span class="live"><i></i>LIVE</span>`;

export const LINKS = ["Following", "Live", "Channels", "Videos", "Recordings"];

/** The top bar: logo, links, global search (every page), account side. `q` types into the search; `dd` is the popover html. */
export function topbar({
  user = true,
  active = "",
  notif = false,
  q = null,
  dd = "",
  auth = false,
  menu = "",
} = {}) {
  const links = LINKS.filter((l) => user || l !== "Following");
  return `<header class="topbar"><div class="col">
    <div class="brand">${icons.radio(20)}<span>adda</span></div>
    <nav class="nav">${links.map((l) => `<a class="${active === l.toLowerCase() ? "on" : ""}">${l}</a>`).join("")}</nav>
    <div class="search ${q !== null ? "focus" : ""}">${icons.search(16)}${q ? `<span style="color:var(--fg)">${q}</span>` : `<span>Search adda…</span>`}${dd}</div>
    <div class="right" style="position:relative">
      ${auth ? "" : user ? `<div class="iconbtn">${icons.bell(18)}${notif ? '<i class="dot"></i>' : ""}</div>${avatar("Rafi Ahmed", 30)}` : '<span class="btn ghost">Sign in</span><span class="btn primary">Create account</span>'}${menu}
    </div>
  </div></header>`;
}

export function footer() {
  const li = (a) => a.map((t) => `<li>${t}</li>`).join("");
  return `<footer class="footer"><div class="col">
    <div class="cols">
      <div><div class="brand">${icons.radio(20)}<span>adda</span></div>
        <p class="muted" style="margin-top:12px;max-width:280px;font-size:13px">A live-streaming site you run yourself, with realtime chat and every broadcast kept.</p>
        <p class="subtle" style="margin-top:10px;font-size:13px">আড্ডা: an unhurried chat among friends.</p></div>
      <div><h4>Watch</h4><ul>${li(["Live now", "Channels", "Videos", "Recordings", "Search"])}</ul></div>
      <div><h4>Project</h4><ul>${li(["About", "Source on GitHub", "Report an issue"])}</ul></div>
      <div><h4>Run your own</h4><ul>${li(["Running a server", "MIT license"])}</ul></div>
    </div>
    <div class="bottom"><span>Built by shahadathhs. Open source under the MIT license.</span><span>Runs on its host's own server.</span></div>
  </div></footer>`;
}

/** Channel card for directories and search: poster, state badge, avatar, name, @slug or stream title. */
export function channelCard({ name, kind, tone, status = "off", line, viewers }) {
  return `<div class="card"><div class="thumb">${scene(kind)}<div class="tl">${status === "live" ? live() : '<span class="offline">Offline</span>'}</div>${status === "live" && viewers ? `<div class="bl"><span style="display:inline-flex">${icons.eye(12)}</span><span class="num">${viewers}</span></div>` : ""}</div>
  <div class="cardmeta">${avatar(name, 36, tone)}<div style="min-width:0;flex:1"><div class="t">${name}</div><div class="s" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${line}</div></div></div></div>`;
}

/** Video or recording card: 16:9 poster, mono duration badge bottom right, title, channel · date. */
export function videoCard({ kind, title, channel, dur, date }) {
  return `<div class="card"><div class="thumb">${scene(kind)}<div class="br num">${dur}</div></div>
  <div style="padding:10px 12px 12px"><div class="t" style="font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${title}</div><div class="s" style="font-size:13px;color:var(--fg-muted);margin-top:2px">${channel} · ${date}</div></div></div>`;
}

export const pager = (range, pages) =>
  `<div class="pager"><span class="num">${range}</span><div class="pg"><span class="dis">${icons.chevl(16)}</span>${pages.map((p) => (p === "…" ? `<span class="dis">…</span>` : `<span class="${p === pages[0] ? "cur" : ""}">${p}</span>`)).join("")}<span>${icons.chevr(16)}</span></div></div>`;

export const sel = (v) => `<div class="sel"><span>${v}</span>${icons.chevd(14)}</div>`;

export const filterBar = ({ q = "", show = "All", sort = "Most viewers", clear = false } = {}) =>
  `<div class="filterbar"><div class="in ${q ? "" : "ph"}">${icons.search(16)}<span style="flex:1">${q || "Filter by name, handle, about or stream title"}</span></div>
  <span class="muted" style="font-size:13px">Show</span>${sel(show)}<span class="muted" style="font-size:13px">Sort by</span>${sel(sort)}${clear ? '<span class="btn ghost">Clear filters</span>' : ""}</div>`;

export function streamCard({ kind, title, channel, viewers, isLive = true, tone, since }) {
  return `<div class="card">
    <div class="thumb">${scene(kind)}
      <div class="tl">${isLive ? live() : `<span class="offline">${since ? "Recording" : "Offline"}</span>`}</div>
      ${isLive ? `<div class="bl"><span style="display:inline-flex">${icons.eye(12)}</span><span class="num">${viewers}</span></div>` : ""}
      ${since ? `<div class="br num">${since}</div>` : ""}
    </div>
    <div class="cardmeta">${avatar(channel, 36, tone)}<div style="min-width:0"><div class="t">${title}</div><div class="s">${channel}</div></div></div>
  </div>`;
}

const EMOTES = {
  pog: `<svg width="20" height="20" viewBox="0 0 20 20" style="display:inline-block;vertical-align:-5px"><circle cx="10" cy="10" r="9" fill="#f5a623"/><circle cx="7" cy="8" r="1.6" fill="#1a1205"/><circle cx="13" cy="8" r="1.6" fill="#1a1205"/><ellipse cx="10" cy="14" rx="2.4" ry="2.8" fill="#1a1205"/></svg>`,
  chai: `<svg width="20" height="20" viewBox="0 0 20 20" style="display:inline-block;vertical-align:-5px"><path d="M4 8h10v4a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4Z" fill="#d9a066"/><path d="M14 9h2a2 2 0 0 1 0 4h-2" fill="none" stroke="#d9a066" stroke-width="1.6"/><path d="M7 3c-1 1 1 2 0 3M10 3c-1 1 1 2 0 3" stroke="#9aa1af" stroke-width="1.2" fill="none"/></svg>`,
  lgtm: `<svg width="20" height="20" viewBox="0 0 20 20" style="display:inline-block;vertical-align:-5px"><rect x="2" y="2" width="16" height="16" rx="3" fill="#2fbf71"/><path d="m6 10.5 3 3 5-6" stroke="#0c0d10" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
};
export const emote = (n) => EMOTES[n];

export function msg({
  user,
  color,
  text,
  badges = [],
  reply,
  mention = false,
  reactions = [],
  anon = false,
}) {
  return `<div class="msg ${mention ? "mention" : ""}">
    ${reply ? `<div class="reply">${icons.reply(12)}<span>Replying to <b>${reply.user}</b> ${reply.text}</span></div>` : ""}
    <div>${badges.map((b) => `<span class="badge ${b}">${b === "fol" ? "follower" : b}</span> `).join("")}<span class="u" style="color:${anon ? "var(--fg-muted)" : color}">${anon ? "Anonymous" : user}</span><span style="color:var(--fg)">: ${text}</span></div>
    ${reactions.length ? `<div>${reactions.map((r) => `<span class="chip ${r.mine ? "mine" : ""}">${r.e}<span class="num">${r.n}</span></span>`).join("")}</div>` : ""}
  </div>`;
}

export const page = (inner, { w = 1440, h = 900 } = {}) => ({ inner, w, h });

/** Phone top bar: logo, search, bell and avatar on one row; the links on a second, sideways-scrolling row. */
export function mobileBar({ active = "" } = {}) {
  return `<header class="topbar" style="height:auto"><div style="height:52px;display:flex;align-items:center;gap:8px;padding:0 16px"><div class="brand">${icons.radio(20)}<span>adda</span></div><div style="flex:1"></div><div class="iconbtn">${icons.search(18)}</div><div class="iconbtn">${icons.bell(18)}<i class="dot"></i></div>${avatar("Rafi Ahmed", 30)}</div>
  <nav class="nav" style="height:40px;align-items:center;padding:0 10px;border-top:1px solid var(--line);overflow:hidden;white-space:nowrap">${LINKS.map((l) => `<a class="${active === l.toLowerCase() ? "on" : ""}">${l}</a>`).join("")}</nav></header>`;
}
