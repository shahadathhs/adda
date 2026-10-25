import { icons, avatar, topbar, footer, scene, live } from "./components.mjs";

/** Whole page: top bar, content area, optional footer, in a fixed-height frame. */
export function shell(top, content, { h = 900, footer: withFooter = false } = {}) {
  return `<div style="display:flex;flex-direction:column;height:${h}px">${topbar(top)}<div style="flex:1;min-height:0;overflow:hidden">${content}</div>${withFooter ? footer() : ""}</div>`;
}

/** Brand illustration: a mini player with broadcast arcs, LIVE badge, timeline with comment ticks and a chat column. */
export function authArt() {
  const arcs = `<svg width="130" height="120" viewBox="0 0 130 120" fill="none" stroke="#f5a623" stroke-width="3" stroke-linecap="round"><path d="M34 20C8 46 8 74 34 100" opacity=".25"/><path d="M50 36C36 52 36 68 50 84" opacity=".55"/><circle cx="65" cy="60" r="8" fill="#f5a623" stroke="none"/><path d="M80 36c14 16 14 32 0 48" opacity=".55"/><path d="M96 20c26 26 26 54 0 80" opacity=".25"/></svg>`;
  const row = (on) =>
    `<div style="display:flex;align-items:center;gap:6px;padding:5px 6px;border-radius:3px;${on ? "background:var(--accent-subtle)" : ""}"><i style="width:8px;height:8px;border-radius:50%;background:${on ? "var(--accent)" : "var(--input)"}"></i><div style="flex:1"><div style="height:4px;width:46%;border-radius:2px;background:${on ? "var(--accent)" : "var(--input)"}"></div><div style="height:4px;width:80%;border-radius:2px;background:var(--input);margin-top:4px"></div></div></div>`;
  return `<div style="display:flex;gap:10px;border:1px solid var(--line);border-radius:8px;padding:10px;background:var(--bg);height:236px">
    <div style="flex:1;position:relative;display:flex;align-items:center;justify-content:center">
      <span class="live" style="position:absolute;left:4px;top:4px"><i></i>LIVE</span>${arcs}
      <div style="position:absolute;left:4px;right:4px;bottom:22px;height:4px;border-radius:2px;background:var(--input)"><i style="position:absolute;inset:0 auto 0 0;width:62%;background:var(--accent);border-radius:2px"></i>${[18, 34, 52, 80].map((x) => `<i style="position:absolute;left:${x}%;top:-4px;width:2px;height:12px;background:var(--fg-subtle)"></i>`).join("")}</div>
      <div style="position:absolute;left:4px;bottom:4px;height:6px;width:44px;border-radius:2px;background:var(--input)"></div>
    </div>
    <div style="width:112px;border:1px solid var(--line);border-radius:6px;background:var(--panel);padding:6px;display:flex;flex-direction:column;gap:2px">${row(false)}${row(false)}${row(true)}${row(false)}${row(false)}<div style="margin-top:auto;height:18px;border:1px solid var(--line);border-radius:3px"></div></div>
  </div>`;
}

/** Auth pages live inside the shared bar and footer: a bordered card on the left, the form centred on the right. */
export function authShell(form, { h = 1120, showLive = false } = {}) {
  const preview = showLive
    ? `<div class="card"><div class="thumb">${scene("bench")}<div class="tl">${live()}</div><div class="bl"><span style="display:inline-flex">${icons.eye(12)}</span><span class="num">312</span></div></div>
        <div class="cardmeta">${avatar("nila_workshop", 36, ["rgba(245,166,35,.14)", "#f5a623"])}<div><div class="t">Restoring the 1974 radio, part 3</div><div class="s">nila_workshop</div></div></div></div>`
    : authArt();
  return shell(
    { user: false, auth: true },
    `<div class="col" style="display:flex;gap:48px;padding-top:32px;padding-bottom:32px;height:100%">
      <aside style="width:480px;flex-shrink:0;background:var(--panel);border:1px solid var(--line);border-radius:8px;padding:32px;display:flex;flex-direction:column;justify-content:space-between">
        <div>${preview}</div>
        <div>
          <h2 class="h1" style="max-width:420px">Your own live-streaming site. Watch, chat, and keep every broadcast.</h2>
          <ul style="margin-top:18px;display:flex;flex-direction:column;gap:8px;color:var(--fg-muted)">
            <li style="display:flex;gap:8px">${icons.check(16)} Live streams with realtime chat</li>
            <li style="display:flex;gap:8px">${icons.check(16)} Every broadcast recorded</li>
            <li style="display:flex;gap:8px">${icons.check(16)} Self-hosted: your server, your data</li>
          </ul>
          <div class="subtle" style="font-size:12px;margin-top:24px">adda runs on the host's own server.</div>
        </div>
      </aside>
      <main style="flex:1;display:flex;align-items:center;justify-content:center">${form}</main>
    </div>`,
    { h, footer: true },
  );
}

export const input = (
  label,
  value,
  { ph = false, err = false, focus = false, help = "", type = "" } = {},
) =>
  `<div><label class="l">${label}</label><div class="in ${ph ? "ph" : ""} ${err ? "err" : ""} ${focus ? "focus" : ""}"><span style="flex:1">${type === "password" ? "••••••••••" : value}</span></div>${help ? `<div class="help ${err ? "err" : ""}">${help}</div>` : ""}</div>`;

/** Settings: eyebrow, H1, route tabs, narrower column inside the page column. */
export function settingsShell(active, content, { h = 900, menu = "" } = {}) {
  const tabs = ["Profile", "Notifications"];
  return shell(
    { active: "", notif: false, menu },
    `<div class="col"><div style="max-width:1040px;margin:0 auto;padding:28px 0 0">
      <div class="eyebrow">Account</div><h1 class="h1" style="margin-top:2px">Settings</h1>
      <div class="tabs" style="margin:16px 0 24px">${tabs.map((t) => `<a class="${t.toLowerCase() === active ? "on" : ""}">${t}</a>`).join("")}</div>
      ${content}
    </div></div>`,
    { h },
  );
}

/** Studio layout: title, tabs, content, inside the page column. */
export function studioShell(active, content, { h = 900, status = "offline" } = {}) {
  const tabs = ["Setup", "Live", "Videos", "Emotes", "Channel page", "Moderators"];
  return shell(
    { active: "", notif: true },
    `<div class="col" style="padding-top:28px">
    <div style="display:flex;align-items:center;justify-content:space-between">
      <div><div class="eyebrow">Studio</div><h1 class="h1" style="margin-top:2px">nila_workshop</h1></div>
      ${status === "live" ? `<div style="display:flex;align-items:center;gap:10px">${live()}<span class="num muted">03:41:08</span><span class="btn danger">End stream</span></div>` : '<span class="offline" style="background:var(--panel-2);padding:2px 8px">Offline</span>'}
    </div>
    <div class="tabs" style="margin:16px 0 24px">${tabs.map((t) => `<a class="${t === active ? "on" : ""}">${t}</a>`).join("")}</div>
    ${content}
  </div>`,
    { h },
  );
}
