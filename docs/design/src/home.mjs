import { avatar, icons, scene, live, streamCard, channelCard, videoCard } from "./components.mjs";
import { T, liveNow, channels, videos, recordings } from "./data.mjs";

export const section = (title, count, aside, cards) => `
  <div style="display:flex;align-items:baseline;justify-content:space-between;margin:32px 0 14px">
    <h2 class="h2">${title} ${count ? `<span class="num muted" style="font-size:14px;font-weight:500;margin-left:6px">${count}</span>` : ""}</h2>
    <span style="display:flex;align-items:center;gap:16px;font-size:13px"><span class="muted">${aside}</span><span style="color:var(--accent);display:inline-flex;align-items:center;gap:4px">View all ${icons.arrow(14)}</span></span>
  </div>
  <div style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px">${cards}</div>`;

const arcs = `<svg width="260" height="260" viewBox="0 0 130 130" fill="none" stroke="#f5a623" stroke-width="1.2" stroke-linecap="round" style="opacity:.3"><path d="M34 20C8 46 8 84 34 110" opacity=".5"/><path d="M50 36C36 52 36 78 50 94" opacity=".8"/><circle cx="65" cy="65" r="6" fill="#f5a623" stroke="none"/><path d="M80 36c14 16 14 42 0 58" opacity=".8"/><path d="M96 20c26 26 26 64 0 90" opacity=".5"/></svg>`;

export function hero({ liveCount = 6, channelCount = 60 } = {}) {
  return `<section class="card" style="position:relative;border-radius:8px;padding:32px;overflow:hidden">
    <div style="position:absolute;right:20px;top:50%;margin-top:-130px">${arcs}</div>
    <div style="position:relative">
      <div class="eyebrow">ADDA</div>
      <h1 class="h1" style="font-size:32px;line-height:38px;margin-top:6px;max-width:520px">Find a stream, a channel or a recording.</h1>
      <div class="in ph" style="width:640px;height:48px;margin-top:20px;font-size:15px">${icons.search(18)}<span>Search channels and recordings…</span></div>
      <div style="display:flex;gap:8px;margin-top:16px">
        <span class="hchip"><i class="livedot" style="width:6px;height:6px;box-shadow:none"></i>Live now <span class="num" style="color:var(--fg)">${liveCount}</span></span>
        <span class="hchip">Channels <span class="num" style="color:var(--fg)">${channelCount}</span></span>
        <span class="hchip">Videos</span><span class="hchip">Recordings</span>
      </div>
    </div>
  </section>`;
}

const rail = [
  ["nila_workshop", true, "312"],
  ["latenight_radio", true, "1.4k"],
  ["kodomo_chess", true, "88"],
  ["tuesday-tabletop", false, ""],
  ["dhaka_dev_chat", false, ""],
];

export function followingRail() {
  return `<aside style="width:240px;border-right:1px solid var(--line);padding:24px 12px 0 0;flex-shrink:0">
    <div class="eyebrow" style="padding:0 8px 10px">Following</div>
    ${rail
      .map(
        ([
          n,
          l,
          v,
        ]) => `<div style="display:flex;align-items:center;gap:10px;padding:7px 8px;border-radius:4px;${l ? "" : "opacity:.55"}">
      ${avatar(n, 28, T.amber)}<div style="flex:1;min-width:0;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${n}</div>
      ${l ? `<span style="display:flex;align-items:center;gap:6px"><span class="livedot" style="width:7px;height:7px;box-shadow:none"></span><span class="num muted" style="font-size:12px">${v}</span></span>` : '<span class="subtle" style="font-size:12px">offline</span>'}
    </div>`,
      )
      .join("")}
  </aside>`;
}

export function featured() {
  return `<section style="display:grid;grid-template-columns:minmax(0,1.7fr) minmax(0,1fr);gap:24px;align-items:stretch;margin-top:24px">
    <div class="card" style="border-radius:8px">
      <div class="thumb" style="aspect-ratio:16/8.2">${scene("bench")}
        <div class="tl">${live()}</div>
        <div class="bl"><span style="display:inline-flex">${icons.eye(12)}</span><span class="num">312</span></div>
        <div class="br num">03:41:08</div>
      </div>
    </div>
    <div style="display:flex;flex-direction:column;justify-content:space-between;padding:4px 0">
      <div>
        <div class="eyebrow" style="color:var(--live)">On air now</div>
        <h2 class="h1" style="margin-top:8px;font-size:24px;line-height:30px">Sunday build: restoring the 1974 radio, part 3</h2>
        <p class="muted" style="margin-top:10px;font-size:13px">Re-capping the power supply and finding out why the left channel hums. Questions welcome in chat.</p>
        <div style="display:flex;align-items:center;gap:10px;margin-top:16px">${avatar("nila_workshop", 36, T.amber)}<div><div style="font-weight:600">nila_workshop</div><div class="muted" style="font-size:13px"><span class="num">4,812</span> followers</div></div></div>
      </div>
      <div style="display:flex;gap:8px"><span class="btn primary">Watch now</span><span class="btn secondary">${icons.heart(14)} Following</span></div>
    </div>
  </section>`;
}

export function homeBody({ all = true } = {}) {
  const live4 = liveNow
    .map((c) =>
      streamCard({
        kind: c.kind,
        title: c.title,
        channel: c.name,
        viewers: c.viewers,
        tone: c.tone,
      }),
    )
    .join("");
  const ch4 = channels
    .slice(4, 8)
    .map((c) => channelCard(c))
    .join("");
  const vid4 = videos.slice(0, 4).map(videoCard).join("");
  const rec4 = recordings.slice(0, 4).map(videoCard).join("");
  return `<div class="col" style="display:flex">
    ${followingRail()}
    <main style="flex:1;min-width:0;padding:24px 0 0 24px">
      ${hero()}${featured()}
      ${section("Live now", "6", "Sorted by viewers", live4)}
      ${all ? section("Channels", "60", "Offline right now", ch4) : ""}
      ${all ? section("Videos", "", "Uploaded by channel owners", vid4) : ""}
      ${all ? section("Recent recordings", "", "Newest first", rec4) : ""}
    </main>
  </div>`;
}
