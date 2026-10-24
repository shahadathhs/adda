import { icons, avatar } from "../components.mjs";
import { studioShell } from "../shells.mjs";

const T = [
  ["rgba(90,169,230,.16)", "#5aa9e6"],
  ["rgba(47,191,113,.16)", "#2fbf71"],
  ["rgba(214,122,177,.16)", "#d67ab1"],
];
const mod = (n, i, since) =>
  `<tr><td><div class="row">${avatar(n, 28, T[i])}<b style="font-weight:500">${n}</b> <span class="badge mod">mod</span></div></td><td class="num muted">${since}</td><td style="text-align:right;color:var(--fg-muted)">Remove</td></tr>`;
const ban = (n, why, left) =>
  `<tr><td><b style="font-weight:500">${n}</b></td><td class="muted">${why}</td><td class="num">${left}</td><td style="text-align:right;color:var(--accent)">Lift</td></tr>`;

export default {
  w: 1440,
  h: 900,
  html: studioShell(
    "Moderators",
    `<div style="display:grid;grid-template-columns:minmax(0,1fr) 380px;gap:24px">
    <div style="display:flex;flex-direction:column;gap:16px">
      <div class="panel"><h2 class="h3">Moderators <span class="num muted" style="font-weight:500">2</span></h2>
        <table class="table" style="margin-top:8px"><thead><tr><th>Member</th><th>Since</th><th></th></tr></thead><tbody>${mod("mehedi", 0, "Mar 2025")}${mod("sadia", 1, "Apr 2025")}</tbody></table>
        <p class="help" style="margin-top:10px">Moderators can delete messages, time out viewers and see who is behind “Anonymous” messages. They can't change channel settings or see your stream key.</p></div>
      <div class="panel"><h2 class="h3">Timeouts and bans <span class="num muted" style="font-weight:500">3</span></h2>
        <table class="table" style="margin-top:8px"><thead><tr><th>Viewer</th><th>Reason</th><th>Remaining</th><th></th></tr></thead><tbody>
          ${ban("spam_bot_77", "Link spam", "09:12")}${ban("loud_louie", "Harassment", "Permanent")}${ban("imposter_nila", "Impersonation", "Permanent")}
        </tbody></table></div>
    </div>
    <div class="panel"><h2 class="h3">Add a moderator</h2><p class="muted" style="font-size:13px;margin:4px 0 14px">Choose someone who follows your channel.</p>
      <div class="in focus"><span style="flex:1">tan</span>${icons.search(16)}</div>
      <div style="margin-top:8px;border:1px solid var(--line);border-radius:6px;overflow:hidden">
        <div class="row" style="padding:10px 12px;background:var(--panel-2)">${avatar("tania_r", 28, T[2])}<div style="flex:1"><b style="font-weight:500">tania_r</b><div class="subtle" style="font-size:12px">follower since Oct 2026</div></div><span class="btn sm primary">Make mod</span></div>
        <div class="row" style="padding:10px 12px">${avatar("tanvir", 28, T[0])}<div style="flex:1"><b style="font-weight:500">tanvir</b><div class="subtle" style="font-size:12px">follower since Jun 2025</div></div><span class="btn sm secondary">Make mod</span></div>
      </div>
    </div>
  </div>`,
  ),
};
