import { icons, avatar, topbar, scene, live } from "./components.mjs";

/** Split-screen auth layout: brand panel + form. */
export function authShell(form, { h = 900 } = {}) {
  return `<div style="display:flex;height:${h}px">
    <aside style="width:560px;flex-shrink:0;background:var(--panel);border-right:1px solid var(--line);padding:40px;display:flex;flex-direction:column;justify-content:space-between">
      <div class="brand" style="font-size:22px">${icons.radio(26)}<span>adda</span></div>
      <div>
        <div class="card" style="max-width:420px;margin-bottom:28px"><div class="thumb">${scene("bench")}<div class="tl">${live()}</div><div class="bl"><span style="display:inline-flex">${icons.eye(12)}</span><span class="num">312</span></div></div>
          <div class="cardmeta">${avatar("nila_workshop", 36, ["rgba(245,166,35,.14)", "#f5a623"])}<div><div class="t">Restoring the 1974 radio, part 3</div><div class="s">nila_workshop</div></div></div></div>
        <h2 class="h1" style="max-width:420px">Your own live-streaming site. Watch, chat, and keep every broadcast.</h2>
        <ul style="margin-top:18px;display:flex;flex-direction:column;gap:8px;color:var(--fg-muted)">
          <li style="display:flex;gap:8px">${icons.check(16)} Live streams with realtime chat</li>
          <li style="display:flex;gap:8px">${icons.check(16)} Every broadcast recorded</li>
          <li style="display:flex;gap:8px">${icons.check(16)} Self-hosted: your server, your data</li>
        </ul>
      </div>
      <div class="subtle" style="font-size:12px">adda runs on the host's own server.</div>
    </aside>
    <main style="flex:1;display:flex;align-items:center;justify-content:center">${form}</main>
  </div>`;
}

export const input = (
  label,
  value,
  { ph = false, err = false, focus = false, help = "", type = "" } = {},
) =>
  `<div><label class="l">${label}</label><div class="in ${ph ? "ph" : ""} ${err ? "err" : ""} ${focus ? "focus" : ""}"><span style="flex:1">${type === "password" ? "••••••••••" : value}</span></div>${help ? `<div class="help ${err ? "err" : ""}">${help}</div>` : ""}</div>`;

/** Settings layout: vertical nav + content. */
export function settingsShell(active, content, { h = 844 } = {}) {
  const nav = [
    ["profile", "Profile"],
    ["notifications", "Notifications"],
    ["password", "Password"],
  ];
  return `${topbar({ active: "", notif: false })}
  <div style="display:flex;max-width:1040px;margin:0 auto;padding:32px 24px;gap:48px;height:${h}px;overflow:hidden">
    <nav style="width:200px;flex-shrink:0"><h1 class="h1" style="margin-bottom:18px">Settings</h1>
      ${nav.map(([k, l]) => `<div style="padding:8px 12px;border-radius:4px;font-weight:500;${k === active ? "background:var(--panel-2);color:var(--fg)" : "color:var(--fg-muted)"}">${l}</div>`).join("")}
    </nav>
    <main style="flex:1;min-width:0">${content}</main>
  </div>`;
}

/** Studio layout: page title, tabs, content. */
export function studioShell(active, content, { h = 844, status = "offline" } = {}) {
  const tabs = ["Setup", "Live", "Emotes", "Channel page", "Moderators"];
  return `${topbar({ active: "", notif: true })}
  <div style="max-width:1240px;margin:0 auto;padding:28px 24px 0;height:${h}px;overflow:hidden">
    <div style="display:flex;align-items:center;justify-content:space-between">
      <div><div class="eyebrow">Studio</div><h1 class="h1" style="margin-top:2px">nila_workshop</h1></div>
      ${status === "live" ? `<div style="display:flex;align-items:center;gap:10px">${live()}<span class="num muted">03:41:08</span><span class="btn danger">End stream</span></div>` : '<span class="offline" style="background:var(--panel-2);padding:2px 8px">Offline</span>'}
    </div>
    <div class="tabs" style="margin:16px 0 24px">${tabs.map((t) => `<a class="${t === active ? "on" : ""}">${t}</a>`).join("")}</div>
    ${content}
  </div>`;
}
