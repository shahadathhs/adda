import { shell } from "../shells.mjs";
import { icons } from "../components.mjs";

const small = (ic, t, d) =>
  `<div class="panel" style="padding:16px"><div style="color:var(--accent)">${ic}</div><div class="h3" style="margin-top:10px">${t}</div><p class="muted" style="font-size:13px;margin-top:4px">${d}</p></div>`;
const who = (t, d, link) =>
  `<div class="panel"><div class="h3">${t}</div><p class="muted" style="font-size:13px;margin-top:6px">${d}</p><div style="color:var(--accent);font-size:13px;margin-top:12px;display:flex;gap:6px;align-items:center">${icons.link(14)} ${link}</div></div>`;

export default {
  w: 1440,
  h: 1120,
  html: shell(
    { active: "", notif: false, user: false },
    `<div class="col" style="padding-top:40px"><div style="max-width:960px">
      <div class="eyebrow">About</div>
      <h1 class="h1" style="font-size:36px;line-height:42px;margin-top:6px;max-width:640px">A live-streaming site you run yourself.</h1>
      <p class="muted" style="margin-top:12px;max-width:640px;font-size:15px;line-height:24px">adda is a small, open-source streaming site with a realtime chat. You broadcast with the encoder you already use, viewers watch in the browser, and every stream is kept as a recording. It runs on one server that you control.</p>
      <div style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px;margin-top:28px">
        ${small(icons.radio(20), "Streaming", "Go live from OBS. Viewers watch in any browser, nothing to install.")}
        ${small(icons.msg(20), "Chat", "Replies, mentions, reactions, polls and moderation tools.")}
        ${small(icons.film(20), "Recordings", "Every broadcast is saved, with timestamped comments.")}
        ${small(icons.lock(20), "Yours", "Your server, your data. No ads and no tracking.")}
      </div>
      <h2 class="h2" style="margin-top:36px">Who and where</h2>
      <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;margin-top:14px">
        ${who("The author", "Built and maintained by shahadathhs.", "github.com/shahadathhs")}
        ${who("Source code", "Open source under the MIT license. Issues and pull requests welcome.", "Source on GitHub")}
        ${who("Website and docs", "Install guides, configuration and the API reference.", "Read the docs")}
      </div>
      <h2 class="h2" style="margin-top:36px">Built with</h2>
      <div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap">${["FastAPI", "Next.js", "PostgreSQL", "Redis", "mediamtx", "Caddy"].map((t) => `<span class="hchip">${t}</span>`).join("")}</div>
    </div></div>`,
    { h: 1120, footer: true },
  ),
};
