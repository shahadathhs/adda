import { topbar, avatar, live, icons, scene, msg, emote } from "./components.mjs";

const amber = ["rgba(245,166,35,.14)", "#f5a623"];

/** The live channel page. `guest` swaps write controls for sign-in prompts. */
export function channelLive({ guest = false, reconnecting = false } = {}) {
  const composer = reconnecting
    ? `<div class="composer"><div class="field" style="opacity:.5"><span style="flex:1;font-size:13px">thanks, rewinding now|</span>${icons.send(18)}</div><div class="subtle" style="font-size:12px;margin-top:8px">Waiting to reconnect. Messages can't be sent right now.</div></div>`
    : guest
      ? `<div class="composer"><div class="banner" style="flex-direction:column;align-items:stretch;gap:10px;background:var(--panel-2)">
        <div style="display:flex;gap:8px;align-items:center;color:var(--fg-muted)">${icons.lock(14)}<span>You are watching as a guest. Sign in to chat, react and vote.</span></div>
        <div style="display:flex;gap:8px"><span class="btn primary" style="flex:1;justify-content:center">Sign in</span><span class="btn secondary" style="flex:1;justify-content:center">Create account</span></div>
      </div></div>`
      : `<div class="composer">
        <div class="field"><span style="flex:1;font-size:13px">Say something to nila_workshop…</span>${icons.smile(18)}${icons.send(18)}</div>
        <div class="subtle" style="font-size:12px;margin-top:8px;display:flex;justify-content:space-between"><span>Chatting as <b style="color:var(--fg-muted);font-weight:600">rafi</b> · <span style="color:var(--accent)">switch to anonymous</span></span><span class="num">0/300</span></div>
      </div>`;
  const banner = reconnecting
    ? `<div class="banner warn" style="margin:10px 14px 0"><div style="width:14px;height:14px;border-radius:50%;border:2px solid var(--input);border-top-color:var(--warn)"></div><span>Chat disconnected. Reconnecting in <span class="num">4s</span>… your draft is kept.</span></div>`
    : "";
  return `
  ${topbar({ user: !guest, active: "", notif: !guest })}
  <div class="col" style="display:flex;height:844px">
    <main style="flex:1;min-width:0;padding:0 24px 0 0;padding-top:20px;overflow:hidden">
      <div class="card" style="border-radius:8px;position:relative">
        <div class="thumb" style="aspect-ratio:16/9;border-bottom:0">${scene("bench")}
          <div class="tl">${live()}</div>
          ${reconnecting ? `<div style="position:absolute;inset:0;background:rgba(12,13,16,.9);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px"><div style="width:36px;height:36px;border-radius:50%;border:3px solid var(--input);border-top-color:var(--accent)"></div><div style="font-weight:600">Reconnecting to the stream…</div><div class="muted" style="font-size:13px">Attempt <span class="num">3</span> · retrying in <span class="num">4s</span></div></div>` : ""}
          <div class="bl" style="left:auto;right:8px;top:8px;bottom:auto"><span style="display:inline-flex">${icons.eye(12)}</span><span class="num">312</span></div>
          <div style="position:absolute;left:0;right:0;bottom:0;height:44px;background:rgba(12,13,16,.82);display:flex;align-items:center;gap:14px;padding:0 14px;color:var(--fg)">
            ${icons.play(18)}${icons.vol(18)}
            <span class="num" style="font-size:12px;color:var(--fg-muted)">03:41:08</span>
            <span style="flex:1"></span>
            <span class="num" style="font-size:12px;color:var(--live);font-weight:600">LIVE</span>${icons.full(18)}
          </div>
        </div>
      </div>
      <div style="display:flex;align-items:flex-start;gap:14px;margin-top:16px">
        ${avatar("nila_workshop", 48, amber)}
        <div style="flex:1;min-width:0">
          <h1 class="h2" style="line-height:26px">Sunday build: restoring the 1974 radio, part 3</h1>
          <div class="muted" style="font-size:13px;margin-top:2px"><b style="color:var(--fg);font-weight:600">nila_workshop</b> · <span class="num">4,812</span> followers · live for <span class="num">3h 41m</span></div>
        </div>
        <div style="display:flex;gap:8px">${guest ? `<span class="btn primary">${icons.heart(14)} Sign in to follow</span>` : `<span class="btn secondary">${icons.bell(14)} Alerts on</span><span class="btn primary">${icons.heart(14)} Following</span>`}</div>
      </div>
      <div class="tabs" style="margin-top:14px"><a class="on">About</a><a>Recordings <span class="num subtle" style="font-size:12px">23</span></a><a>Videos <span class="num subtle" style="font-size:12px">4</span></a><a>Followers</a></div>
      <div style="display:flex;gap:32px;margin-top:14px;font-size:13px">
        <p class="muted" style="max-width:560px">Slow repairs of old radios, record players and the odd tape deck. New stream most Sundays. Be kind in chat; ask anything about capacitors.</p>
        <div class="muted" style="display:flex;flex-direction:column;gap:6px">
          <span style="display:flex;gap:6px;align-items:center;color:var(--accent)">${icons.link(14)} nilaworkshop.example</span>
          <span style="display:flex;gap:6px;align-items:center">${icons.users(14)} <span class="num">312</span> watching</span>
        </div>
      </div>
    </main>
    <aside class="chat" style="width:340px;flex-shrink:0">
      <div class="head"><span>Chat</span><span class="num muted" style="font-size:12px;font-weight:500">312 here</span></div>
      <div class="pinned">
        <div style="display:flex;align-items:center;gap:6px;color:var(--fg-muted);margin-bottom:3px">${icons.pin(12)}<span style="font-size:12px;font-weight:600">Pinned by nila_workshop</span></div>
        Today: new power supply, then the left-channel hum. Stream key leaks go to the mods, not chat.
      </div>
      <div class="poll">
        <div style="display:flex;align-items:center;gap:6px">${icons.chart(14)}<b style="font-weight:600">What should we fix first?</b></div>
        <div class="opt ${guest ? "" : "mine"}"><div class="fill" style="width:58%"></div><span>Left-channel hum</span><span class="num">58%</span></div>
        <div class="opt"><div class="fill" style="width:27%"></div><span>Dial lamp</span><span class="num">27%</span></div>
        <div class="opt"><div class="fill" style="width:15%"></div><span>Tuning cord</span><span class="num">15%</span></div>
        <div class="subtle" style="font-size:12px;margin-top:8px"><span class="num">186</span> votes · ${guest ? "sign in to vote" : 'closes in <span class="num">02:10</span>'}</div>
      </div>
      ${banner}
      <div class="msgs"${reconnecting ? ' style="opacity:.55"' : ""}>
        ${msg({ user: "joy_k", color: "#8f7ff0", text: "is that a Philips? the dial looks right" })}
        ${msg({ user: "imran", color: "#4cc38a", text: `we need a close-up of the transformer ${emote("pog")}`, reactions: [{ e: "👍", n: 7 }] })}
        ${msg({ user: "mehedi", color: "#5aa9e6", text: `that hum is the filter cap, 100% ${emote("lgtm")}`, badges: ["fol"] })}
        ${msg({
          user: "tania_r",
          color: "#d67ab1",
          text: `new here, loving the pace ${emote("chai")}`,
          reactions: [
            { e: "👍", n: 4 },
            { e: "☕", n: 2, mine: !guest },
          ],
        })}
        ${msg({ user: "nila_workshop", color: "#f5a623", text: "Welcome Tania! Chai is mandatory in here.", badges: ["owner"], reply: { user: "tania_r", text: "new here, loving the…" } })}
        ${msg({ user: "Anonymous", text: "can you show the schematic again?", anon: true })}
        ${msg({ user: "sadia", color: "#4cc38a", text: `<span style="color:var(--accent)">@rafi</span> you asked about the 6V6 earlier, she covered it at 02:40 ${emote("pog")}`, badges: ["mod"], mention: !guest })}
        ${msg({ user: "rafi", color: "#f5a623", text: "thanks both, rewinding now" })}
      </div>
      ${composer}
    </aside>
  </div>`;
}
