import { icons, avatar } from "../components.mjs";
import { studioShell, input } from "../shells.mjs";

export default {
  w: 1440,
  h: 1000,
  html: studioShell(
    "Channel page",
    `<div style="display:grid;grid-template-columns:minmax(0,1fr) 380px;gap:24px">
    <div style="display:flex;flex-direction:column;gap:16px">
      <div class="panel" style="display:flex;flex-direction:column;gap:14px"><h2 class="h3">Channel details</h2>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">${input("Channel name", "nila_workshop")}${input("Page address", "adda.example.com/channel/nila_workshop", { help: "Changing this breaks old links." })}</div>
        ${input("Stream title", "Sunday build: restoring the 1974 radio, part 3")}
        <div><label class="l">About</label><div class="in" style="height:80px;align-items:flex-start;padding-top:10px">Slow repairs of old radios, record players and the odd tape deck. New stream most Sundays.</div></div>
        <div><label class="l">Links</label><div style="display:flex;flex-direction:column;gap:8px"><div class="in"><span style="flex:1">nilaworkshop.example</span><span class="subtle">Remove</span></div><div class="in"><span style="flex:1">Tape-deck notes</span><span class="subtle">Remove</span></div></div><div class="help" style="color:var(--accent)">+ Add link</div></div>
        <div class="row" style="justify-content:flex-end"><span class="btn secondary">Discard</span><span class="btn primary">Save changes</span></div>
      </div>
      <div class="panel" style="border-color:rgba(239,68,68,.4)"><h2 class="h3" style="color:var(--danger)">Delete channel</h2><p class="muted" style="font-size:13px;margin:4px 0 12px">Removes the channel, its 23 recordings, emotes and followers. This cannot be undone.</p>
        <div class="row"><div class="in" style="flex:1"><span class="subtle">Type nila_workshop to confirm</span></div><span class="btn danger">Delete channel</span></div></div>
    </div>
    <div style="display:flex;flex-direction:column;gap:16px">
      <div class="panel"><h2 class="h3">Banner</h2><div style="margin-top:10px;height:90px;border-radius:6px;background:var(--panel-2);display:grid;place-items:center;color:var(--fg-muted)">${icons.copy(18)}</div><div class="help">1500 × 400 px, up to 2 MB.</div></div>
      <div class="panel"><h2 class="h3">Post an announcement</h2>
        <div class="in" style="height:76px;align-items:flex-start;padding-top:10px;margin-top:10px"><span class="subtle">Share news with your followers…</span></div>
        <div class="row" style="margin-top:10px"><div class="check on">${icons.check(11)}</div><span style="font-size:13px">Pin to my channel page</span><span style="flex:1"></span><span class="btn primary sm">Post</span></div>
        <div class="sep"></div>
        <div style="font-size:13px;display:flex;flex-direction:column;gap:10px"><div><span class="subtle num">Oct 22 · pinned</span><div>Next Sunday: the dial lamp.</div></div><div><span class="subtle num">Oct 09</span><div>Moved the stream key.</div></div></div>
      </div>
    </div>
  </div>`,
    { h: 1000 },
  ),
};
