import { icons, scene, msg, emote } from "../components.mjs";
import { studioShell, input } from "../shells.mjs";

const stat = (l, v, ok = true) =>
  `<div class="panel" style="padding:12px"><div class="eyebrow">${l}</div><div class="num" style="font-size:22px;font-weight:600;margin-top:4px">${v}</div>${ok ? '<div class="help" style="color:var(--ok)">Healthy</div>' : '<div class="help" style="color:var(--warn)">Watch this</div>'}</div>`;

export default {
  w: 1440,
  h: 900,
  html: studioShell(
    "Live",
    `<div style="display:grid;grid-template-columns:minmax(0,1fr) 340px;gap:24px">
    <div>
      <div style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px">
        ${stat("Viewers", "312")}${stat("Bitrate", "4,512 kbps")}${stat("Frame rate", "60 fps")}${stat("Dropped frames", "0.2%", false)}
      </div>
      <div class="panel" style="margin-top:16px">
        <div class="row"><h2 class="h3" style="flex:1">Start a poll</h2><span class="tag">One poll at a time</span></div>
        <div style="display:flex;flex-direction:column;gap:12px;margin-top:14px">
          ${input("Question", "What should we fix first?")}
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px">${input("Option 1", "Left-channel hum")}${input("Option 2", "Dial lamp")}${input("Option 3", "Tuning cord")}</div>
          <div class="row"><div class="seg"><span>2 min</span><span class="on">5 min</span><span>10 min</span></div><span style="flex:1"></span><span class="btn primary">${icons.chart(14)} Start poll</span></div>
        </div>
      </div>
      <div class="panel" style="margin-top:16px">
        <h2 class="h3">Pinned message</h2>
        <div class="banner" style="margin-top:12px">${icons.pin(14)}<span style="flex:1">Today: new power supply, then the left-channel hum.</span><span style="color:var(--accent)">Unpin</span></div>
        <div class="field" style="margin-top:10px"><span style="flex:1;font-size:13px">Pin a new message…</span><span class="btn sm primary">Pin</span></div>
      </div>
    </div>
    <div style="display:flex;flex-direction:column;gap:16px">
      <div class="panel" style="padding:12px"><div class="eyebrow" style="margin-bottom:8px">Chat moderation</div>
        <div style="display:flex;flex-direction:column;gap:10px;font-size:13px">
          <div class="row"><span style="flex:1">Slow mode</span><div class="seg"><span>Off</span><span class="on">5 s</span><span>30 s</span></div></div>
          <div class="row"><span style="flex:1">Followers only</span><div class="toggle"></div></div>
        </div>
        <div class="sep" style="margin:12px 0"></div>
        <div class="eyebrow" style="margin-bottom:6px">Recent actions</div>
        <div style="font-size:13px;display:flex;flex-direction:column;gap:8px">
          <div><b style="font-weight:600">sadia</b> <span class="muted">timed out</span> spam_bot_77 <span class="subtle num">10 min</span></div>
          <div><b style="font-weight:600">mehedi</b> <span class="muted">deleted a message by</span> <span class="muted">Anonymous</span></div>
        </div>
      </div>
      <div class="panel" style="padding:0;overflow:hidden"><div class="head" style="height:40px;display:flex;align-items:center;padding:0 12px;border-bottom:1px solid var(--line);font-weight:600">Live chat <span class="num muted" style="margin-left:auto;font-weight:500;font-size:12px">312 here</span></div>
        <div class="msgs" style="min-height:250px;justify-content:flex-start;padding:10px 12px">
          ${msg({ user: "tania_r", color: "#d67ab1", text: `new here, loving the pace ${emote("chai")}` })}
          ${msg({ user: "Anonymous", text: "can you show the schematic again?", anon: true })}
          <div class="subtle" style="font-size:12px">You can see who is behind “Anonymous”: <span style="color:var(--accent)">reveal</span> · <span style="color:var(--accent)">timeout</span> · <span style="color:var(--accent)">delete</span></div>
          ${msg({ user: "imran", color: "#4cc38a", text: "we need a close-up of the transformer" })}
        </div></div>
    </div>
  </div>`,
    { status: "live" },
  ),
};
