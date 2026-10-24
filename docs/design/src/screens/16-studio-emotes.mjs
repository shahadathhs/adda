import { icons, emote } from "../components.mjs";
import { studioShell, input } from "../shells.mjs";

const tile = (svg, name, uses) =>
  `<div class="panel" style="padding:12px;display:flex;flex-direction:column;align-items:center;gap:8px"><div style="transform:scale(2.2);margin:10px 0">${svg}</div><div class="mono" style="font-size:13px">:${name}:</div><div class="subtle" style="font-size:12px"><span class="num">${uses}</span> uses</div><div class="row" style="gap:10px;font-size:12px;color:var(--fg-muted)"><span>Rename</span><span>Remove</span></div></div>`;

export default {
  w: 1440,
  h: 900,
  html: studioShell(
    "Emotes",
    `<div style="display:grid;grid-template-columns:minmax(0,1fr) 340px;gap:24px">
    <div>
      <div class="row" style="margin-bottom:14px"><h2 class="h3" style="flex:1">Your emotes <span class="num muted" style="font-weight:500">3 of 50</span></h2><span class="tag">Viewers type :name: in chat</span></div>
      <div style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px">
        ${tile(emote("chai"), "chai", "1,204")}${tile(emote("pog"), "pog", "862")}${tile(emote("lgtm"), "lgtm", "540")}
        <div style="border:1px dashed var(--input);border-radius:6px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;color:var(--fg-muted);min-height:158px">${icons.copy(20)}<span style="font-size:13px">Drop an image here</span></div>
      </div>
    </div>
    <div class="panel"><h2 class="h3">Add an emote</h2>
      <div style="display:flex;flex-direction:column;gap:14px;margin-top:14px">
        <div><label class="l">Image</label><div class="in"><span style="flex:1">radio-hum.png</span><span class="btn sm secondary">Choose</span></div><div class="help">PNG, GIF or WebP, up to 256 KB, 128 × 128 px.</div></div>
        ${input("Name", "hum", { focus: true, help: "Letters, numbers and underscores. Used as :hum:." })}
        <div class="row"><div class="panel" style="padding:10px;background:var(--bg);flex:1;text-align:center"><span class="mono" style="color:var(--fg-muted)">preview</span><div style="margin-top:6px"><span style="display:inline-block;width:20px;height:20px;border-radius:4px;background:var(--accent);vertical-align:-5px"></span> <span style="font-size:13px">that hum again :hum:</span></div></div></div>
        <span class="btn primary" style="justify-content:center">Add emote</span>
      </div></div>
  </div>`,
  ),
};
