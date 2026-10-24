import { topbar, streamCard, avatar, live, icons, scene } from "../components.mjs";

const T = {
  amber: ["rgba(245,166,35,.14)", "#f5a623"],
  green: ["rgba(47,191,113,.16)", "#2fbf71"],
  blue: ["rgba(90,169,230,.16)", "#5aa9e6"],
  pink: ["rgba(214,122,177,.16)", "#d67ab1"],
};

const following = [
  ["nila_workshop", true, "312"],
  ["latenight_radio", true, "1.4k"],
  ["kodomo_chess", true, "88"],
  ["tuesday-tabletop", false, ""],
  ["dhaka_dev_chat", false, ""],
];

export default {
  w: 1440,
  h: 1040,
  html: `
  ${topbar({ active: "browse", notif: true })}
  <div style="display:flex;height:984px">
    <aside style="width:240px;border-right:1px solid var(--line);padding:20px 12px;flex-shrink:0">
      <div class="eyebrow" style="padding:0 8px 10px">Following</div>
      ${following
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
      <div class="eyebrow" style="padding:24px 8px 10px">Recent recordings</div>
      <div style="padding:4px 8px;display:flex;flex-direction:column;gap:12px;font-size:13px">
        <div><div style="font-weight:500">Sunday build: the stack</div><div class="subtle num" style="font-size:12px">nila_workshop · 2h 14m</div></div>
        <div><div style="font-weight:500">Endgames, slowly</div><div class="subtle num" style="font-size:12px">kodomo_chess · 1h 02m</div></div>
      </div>
    </aside>

    <main style="flex:1;padding:24px;overflow:hidden">
      <!-- featured: the one dominant element -->
      <section style="display:grid;grid-template-columns:minmax(0,1.7fr) minmax(0,1fr);gap:24px;align-items:stretch">
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
            <h1 class="h1" style="margin-top:8px">Sunday build: restoring the 1974 radio, part 3</h1>
            <p class="muted" style="margin-top:12px;max-width:380px">Re-capping the power supply and finding out why the left channel hums. Questions welcome in chat.</p>
            <div style="display:flex;align-items:center;gap:10px;margin-top:20px">${avatar("nila_workshop", 36, T.amber)}<div><div style="font-weight:600">nila_workshop</div><div class="muted" style="font-size:13px"><span class="num">4,812</span> followers</div></div></div>
          </div>
          <div style="display:flex;gap:8px"><span class="btn primary">Watch now</span><span class="btn secondary">${icons.heart(14)} Following</span></div>
        </div>
      </section>

      <div style="display:flex;align-items:baseline;justify-content:space-between;margin:32px 0 14px">
        <h2 class="h2">Live now <span class="num muted" style="font-size:14px;font-weight:500;margin-left:6px">6</span></h2>
        <span class="muted" style="font-size:13px">Sorted by viewers</span>
      </div>
      <div style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px">
        ${streamCard({ kind: "radio", title: "Late night requests · open lines", channel: "latenight_radio", viewers: "1,402", tone: T.pink })}
        ${streamCard({ kind: "code", title: "Writing a tiny HTTP server in Zig", channel: "dhaka_dev_chat", viewers: "276", tone: T.blue })}
        ${streamCard({ kind: "chess", title: "Rook endgames, slowly (beginners)", channel: "kodomo_chess", viewers: "88", tone: T.green })}
        ${streamCard({ kind: "dice", title: "Tuesday tabletop: the sunken keep", channel: "tuesday-tabletop", viewers: "64", tone: T.amber })}
      </div>

      <div style="display:flex;align-items:baseline;justify-content:space-between;margin:32px 0 14px">
        <h2 class="h2">Recent recordings</h2>
        <span class="muted" style="font-size:13px">From channels you follow</span>
      </div>
      <div style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px">
        ${streamCard({ kind: "bench", title: "Sunday build: the stack", channel: "nila_workshop", isLive: false, since: "2:14:09", tone: T.amber })}
        ${streamCard({ kind: "chess", title: "Endgames, slowly", channel: "kodomo_chess", isLive: false, since: "1:02:44", tone: T.green })}
        ${streamCard({ kind: "code", title: "Zig HTTP server, part 1", channel: "dhaka_dev_chat", isLive: false, since: "2:48:30", tone: T.blue })}
        ${streamCard({ kind: "dice", title: "The sunken keep, session 4", channel: "tuesday-tabletop", isLive: false, since: "3:31:12", tone: T.amber })}
      </div>
    </main>
  </div>`,
};
