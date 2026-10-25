import { shell } from "../shells.mjs";
import { icons, channelCard, videoCard } from "../components.mjs";
import { channels, videos, recordings } from "../data.mjs";

const group = (title, count, cards) => `
  <div style="display:flex;align-items:baseline;justify-content:space-between;margin:28px 0 14px">
    <h2 class="h2">${title} <span class="num muted" style="font-size:14px;font-weight:500;margin-left:6px">${count}</span></h2>
    <span style="color:var(--accent);display:inline-flex;align-items:center;gap:4px;font-size:13px">Filter and page through all ${icons.arrow(14)}</span>
  </div>
  <div style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px">${cards}</div>`;

export default {
  w: 1440,
  h: 1180,
  html: shell(
    { active: "", notif: true, q: "radio" },
    `<div class="col" style="padding-top:28px">
      <div class="eyebrow">Search</div>
      <h1 class="h1" style="margin-top:2px">Results for “radio”</h1>
      <div class="in" style="margin-top:16px;max-width:640px;height:44px">${icons.search(16)}<span style="flex:1">radio</span></div>
      ${group("Channels", 5, [channels[0], channels[1], channels[5], channels[6]].map(channelCard).join(""))}
      ${group("Videos", 3, [videos[3], videos[4], videos[0]].map(videoCard).join(""))}
      ${group("Recordings", 6, [recordings[4], recordings[6], recordings[5], recordings[0]].map(videoCard).join(""))}
    </div>`,
    { h: 1180 },
  ),
};
