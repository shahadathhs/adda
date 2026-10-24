import { topbar, avatar, icons, scene } from "../components.mjs";

const amber = ["rgba(245,166,35,.14)", "#f5a623"];
const c = (
  time,
  user,
  color,
  text,
  mine = false,
) => `<div style="padding:12px 14px;border-bottom:1px solid var(--line)">
  <div style="display:flex;align-items:center;gap:8px;font-size:13px"><b style="color:${color};font-weight:600">${user}</b><span class="mono" style="color:var(--accent);background:var(--accent-subtle);border-radius:3px;padding:0 5px;font-size:12px">${time}</span><span class="subtle" style="font-size:12px;margin-left:auto">${mine ? "Delete" : "2d ago"}</span></div>
  <div style="margin-top:4px;font-size:13px;line-height:18px">${text}</div></div>`;

export default {
  w: 1440,
  h: 900,
  html: `
  ${topbar({ active: "browse", notif: false })}
  <div style="display:flex;height:844px">
    <main style="flex:1;min-width:0;padding:20px 24px;overflow:hidden">
      <div class="card" style="border-radius:8px">
        <div class="thumb" style="aspect-ratio:16/9;border-bottom:0">${scene("bench")}
          <div style="position:absolute;left:0;right:0;bottom:0;background:rgba(12,13,16,.86);padding:10px 14px 12px">
            <div style="position:relative;height:6px;border-radius:3px;background:var(--input);margin-bottom:10px">
              <div style="position:absolute;inset:0 auto 0 0;width:31%;background:var(--accent);border-radius:3px"></div>
              <i class="tick" style="left:18%;background:var(--fg)"></i><i class="tick" style="left:31%;background:var(--fg)"></i><i class="tick" style="left:47%;background:var(--fg)"></i><i class="tick" style="left:63%;background:var(--fg)"></i><i class="tick" style="left:81%;background:var(--fg)"></i>
              <div style="position:absolute;left:31%;top:-4px;width:14px;height:14px;border-radius:50%;background:var(--accent);margin-left:-7px"></div>
            </div>
            <div style="display:flex;align-items:center;gap:14px">${icons.play(18)}${icons.vol(18)}<span class="num" style="font-size:12px;color:var(--fg-muted)">01:09:42 / 03:41:08</span><span style="flex:1"></span><span class="num muted" style="font-size:12px">1x</span>${icons.full(18)}</div>
          </div>
        </div>
      </div>
      <div style="display:flex;align-items:flex-start;gap:14px;margin-top:16px">
        ${avatar("nila_workshop", 44, amber)}
        <div style="flex:1"><h1 class="h2" style="line-height:26px">Sunday build: restoring the 1974 radio, part 3</h1>
          <div class="muted" style="font-size:13px;margin-top:2px"><b style="color:var(--fg);font-weight:600">nila_workshop</b> · recorded <span class="num">Oct 18</span> · <span class="num">3:41:08</span> · <span class="num">1,204</span> views</div></div>
        <span class="btn secondary">${icons.copy(14)} Download</span>
      </div>
      <p class="muted" style="margin-top:14px;font-size:13px;max-width:640px">Re-capping the power supply and finding out why the left channel hums. White ticks on the timeline mark where viewers left a comment.</p>
    </main>
    <aside class="chat" style="width:340px;flex-shrink:0">
      <div class="head"><span>Comments <span class="num muted" style="font-weight:500">14</span></span><span class="tag">Newest first</span></div>
      <div style="flex:1;overflow:hidden">
        ${c("01:09:42", "mehedi", "#5aa9e6", "this is the exact moment the hum disappears. cap swap confirmed.")}
        ${c("00:47:10", "tania_r", "#d67ab1", "what ohm is that resistor? couldn't read the bands", false)}
        ${c("00:47:55", "nila_workshop", "#f5a623", "@tania_r 4.7k, yellow-violet-red. I should have zoomed in.")}
        ${c("00:22:05", "rafi", "#f5a623", "saving this timestamp for the filter-cap explainer", true)}
        ${c("00:05:30", "joy_k", "#8f7ff0", "the intro explaining the safety discharge is gold")}
      </div>
      <div class="composer"><div class="field"><span class="mono" style="color:var(--accent);background:var(--accent-subtle);border-radius:3px;padding:0 5px;font-size:12px">01:09:42</span><span style="flex:1;font-size:13px">Comment at this moment…</span>${icons.send(18)}</div>
        <div class="subtle" style="font-size:12px;margin-top:8px">Commenting as <b style="color:var(--fg-muted)">rafi</b></div></div>
    </aside>
  </div>`,
};
