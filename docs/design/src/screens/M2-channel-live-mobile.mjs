import { avatar, icons, scene, live, msg, emote, mobileBar } from "../components.mjs";

const amber = ["rgba(245,166,35,.14)", "#f5a623"];

export default {
  w: 390,
  h: 844,
  html: `${mobileBar({ active: "" })}
  <div style="height:752px;display:flex;flex-direction:column">
    <div class="thumb" style="border-bottom:1px solid var(--line)">${scene("bench")}<div class="tl">${live()}</div><div class="bl" style="left:auto;right:8px;top:8px;bottom:auto"><span style="display:inline-flex">${icons.eye(12)}</span><span class="num">312</span></div></div>
    <div style="padding:12px 16px;display:flex;gap:10px;align-items:center;border-bottom:1px solid var(--line)">${avatar("nila_workshop", 36, amber)}<div style="flex:1;min-width:0"><div style="font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">Restoring the 1974 radio, part 3</div><div class="muted" style="font-size:12px">nila_workshop · <span class="num">4,812</span> followers</div></div><span class="btn sm primary">${icons.heart(12)} Following</span></div>
    <div class="tabs" style="padding:0 6px"><a class="on">Chat</a><a>About</a><a>Recordings</a><a>Videos</a></div>
    <div class="pinned" style="margin:10px 12px 0;display:flex;gap:6px;align-items:center">${icons.pin(12)}<span><b style="font-weight:600">Pinned:</b> Today: new power supply, then the hum.</span></div>
    <div class="banner" style="margin:8px 12px 0;padding:8px 12px">${icons.chart(14)}<span style="flex:1"><b style="font-weight:600">Poll:</b> What should we fix first?</span><span style="color:var(--accent);font-size:12px;font-weight:600">Vote · <span class="num">58%</span> leading</span></div>
    <div class="msgs" style="padding:8px 14px">
      ${msg({ user: "imran", color: "#4cc38a", text: `we need a close-up of the transformer ${emote("pog")}`, reactions: [{ e: "👍", n: 7 }] })}
      ${msg({ user: "tania_r", color: "#d67ab1", text: `new here, loving the pace ${emote("chai")}` })}
      ${msg({ user: "nila_workshop", color: "#f5a623", text: "Welcome Tania! Chai is mandatory.", badges: ["owner"], reply: { user: "tania_r", text: "new here…" } })}
      ${msg({ user: "sadia", color: "#4cc38a", text: `<span style="color:var(--accent)">@rafi</span> she covered the 6V6 at 02:40`, badges: ["mod"], mention: true })}
    </div>
    <div class="composer" style="padding-bottom:20px"><div class="field"><span style="flex:1;font-size:13px">Say something…</span>${icons.smile(18)}${icons.send(18)}</div><div class="subtle" style="font-size:12px;margin-top:8px">Chatting as <b style="color:var(--fg-muted)">rafi</b> · <span style="color:var(--accent)">go anonymous</span></div></div>
  </div>`,
};
