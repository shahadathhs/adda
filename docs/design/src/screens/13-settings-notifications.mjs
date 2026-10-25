import { icons, avatar } from "../components.mjs";
import { settingsShell } from "../shells.mjs";

const menu = `<div class="menu" style="right:0;top:40px;width:240px;z-index:40">
  <div style="padding:12px 14px;border-bottom:1px solid var(--line)"><div style="font-weight:600">Rafi Ahmed</div><div class="muted" style="font-size:13px">@rafi</div><div style="font-size:13px;margin-top:4px">☕ Back at 6, streaming the radio build</div></div>
  <div style="padding:8px 14px">Your channel</div><div style="padding:8px 14px">Studio</div><div style="padding:8px 14px;background:var(--panel-2)">Settings</div>
  <div style="padding:8px 14px;border-top:1px solid var(--line)">Sign out</div></div>`;

const T = ["rgba(245,166,35,.14)", "#f5a623"];
const row = (t, d, on) =>
  `<div class="row" style="padding:12px 0;border-bottom:1px solid var(--line)"><div style="flex:1"><div style="font-weight:500">${t}</div><div class="muted" style="font-size:13px">${d}</div></div><div class="toggle ${on ? "on" : ""}"></div></div>`;
const ch = (n, bell, mail) =>
  `<tr><td><div class="row">${avatar(n, 28, T)}<b style="font-weight:500">${n}</b></div></td><td><div class="toggle ${bell ? "on" : ""}"></div></td><td><div class="toggle ${mail ? "on" : ""}"></div></td></tr>`;

export default {
  w: 1440,
  h: 900,
  html: settingsShell(
    "notifications",
    `
    <h2 class="h2">Notifications</h2>
    <div class="panel" style="margin-top:16px;padding-top:4px;padding-bottom:4px">
      <div class="eyebrow" style="padding-top:14px">In the app (bell)</div>
      ${row("A channel I follow goes live", "Appears in the bell, with a dot on the icon", true)}
      ${row("Someone mentions me", "When your name is used with @", true)}
      ${row("Someone replies to my message", "Includes replies to comments on recordings", true)}
    </div>

    <h2 class="h2" style="margin-top:32px">Email</h2>
    <div class="panel" style="margin-top:16px">
      <div class="banner" style="margin-bottom:12px">${icons.check(14)}<span>Email is set up on this server. Alerts go to <b>rafi@example.com</b>.</span></div>
      <div class="row"><div style="flex:1"><div style="font-weight:500">Email me when a followed channel goes live</div><div class="muted" style="font-size:13px">At most one email per channel per hour. Off by default.</div></div><div class="toggle on"></div></div>
      <table class="table" style="margin-top:14px"><thead><tr><th>Channel</th><th>Bell</th><th>Email</th></tr></thead><tbody>
        ${ch("nila_workshop", true, true)}${ch("latenight_radio", true, false)}${ch("kodomo_chess", true, true)}${ch("tuesday-tabletop", false, false)}
      </tbody></table>
    </div>`,
    { menu },
  ),
};
