import { icons, scene } from "./components.mjs";
import { studioShell, input } from "./shells.mjs";

const row = ({
  kind,
  title,
  status,
  tone = "ok",
  meta,
  err,
}) => `<div class="row" style="align-items:flex-start;padding:14px 0;border-bottom:1px solid var(--line);gap:14px">
  <div class="thumb" style="width:144px;flex-shrink:0;border:1px solid var(--line);border-radius:4px">${scene(kind)}</div>
  <div style="flex:1;min-width:0">
    <div class="row" style="gap:8px"><span style="font-weight:600;color:var(--accent);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${title}</span><span class="status ${tone}">${status}</span></div>
    <div class="muted num" style="font-size:13px;margin-top:4px">${meta}</div>
    ${err ? `<div style="color:var(--danger);font-size:13px;margin-top:4px">${err}</div>` : ""}
    <div class="row" style="gap:8px;margin-top:10px"><span class="btn secondary sm">Edit</span><span class="btn ghost sm" style="color:var(--danger)">Delete</span></div>
  </div></div>`;

/** Studio, Videos tab. `uploading` swaps the upload form for an in-progress state. */
export function studioVideos({ uploading = false } = {}) {
  const rows = uploading
    ? [
        row({
          kind: "radio",
          title: "How a superhet receiver works",
          status: "Preparing…",
          tone: "warn",
          meta: "Oct 24, 2026 · — · 3.4 GB",
        }),
        row({
          kind: "wave",
          title: "Shortwave band report, October",
          status: "Failed",
          tone: "err",
          meta: "Oct 23, 2026 · 12:30 · 880 MB",
          err: "The file could not be decoded. Try re-exporting it as H.264 MP4.",
        }),
        row({
          kind: "bench",
          title: "Dial lamp swap, start to finish",
          status: "Public",
          meta: "Oct 24, 2026 · 3:03 · 310 KB",
        }),
        row({
          kind: "bench",
          title: "Tape deck belts, a field guide",
          status: "Public",
          meta: "Oct 2, 2026 · 15:21 · 412 MB",
        }),
      ]
    : [
        row({
          kind: "bench",
          title: "Dial lamp swap, start to finish",
          status: "Public",
          meta: "Oct 24, 2026 · 3:03 · 310 KB",
        }),
        row({
          kind: "bench",
          title: "Tape deck belts, a field guide",
          status: "Public",
          meta: "Oct 2, 2026 · 15:21 · 412 MB",
        }),
        row({
          kind: "radio",
          title: "Soldering for the nervous",
          status: "Paused at 40%",
          tone: "warn",
          meta: "Oct 1, 2026 · — · 1.1 GB",
        }),
        row({
          kind: "code",
          title: "Unlisted rehearsal",
          status: "Public",
          meta: "Sep 20, 2026 · 6:02 · 120 MB",
        }),
      ];
  const select = (l, v) =>
    `<div><label class="l">${l}</label><div class="in" style="justify-content:space-between"><span>${v}</span>${icons.chevd(14)}</div></div>`;
  const drop = uploading
    ? `<div style="border:1px dashed var(--input);border-radius:6px;padding:16px">
        <div class="row" style="font-size:13px"><span style="font-weight:600;flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">superhet-explained.mp4</span><span class="num muted">1.2 GB of 3.4 GB &nbsp;35%</span></div>
        <div class="bar" style="margin-top:10px"><i style="width:35%"></i></div>
        <div class="row" style="margin-top:12px"><span class="subtle" style="font-size:12px;flex:1">Uploading in chunks. If your connection drops, it resumes where it stopped.</span><span class="btn secondary sm">Cancel upload</span></div>
      </div>`
    : `<div style="border:1px dashed var(--input);border-radius:6px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;color:var(--fg-muted);padding:28px 16px;text-align:center">${icons.upload(22)}<div style="color:var(--fg);font-weight:500">Choose a video or drop it here</div><div style="font-size:12px">MP4, MOV or WebM, up to 4 GB. H.264 or VP9 plays everywhere.</div></div>`;
  return studioShell(
    "Videos",
    `<div style="display:grid;grid-template-columns:minmax(0,1fr) 380px;gap:24px;align-items:start">
      <div><h2 class="h2">Your videos <span class="num muted" style="font-size:14px;font-weight:500;margin-left:6px">${uploading ? 4 : 4}</span></h2>
        <div style="margin-top:8px;border-top:1px solid var(--line)">${rows.join("")}</div></div>
      <div class="panel" style="display:flex;flex-direction:column;gap:14px">
        <h2 class="h3">Upload a video</h2>
        ${drop}
        ${input("Title", uploading ? "How a superhet receiver works" : "Add a title")}
        <div><label class="l">Description</label><div class="in" style="height:72px;align-items:flex-start;padding-top:10px">${uploading ? "A walk through mixers, IF stages and detectors." : '<span class="subtle">What is in the video?</span>'}</div></div>
        ${select("Who can watch", "Public")}
        <span class="btn primary" style="height:36px;justify-content:center;${uploading ? "opacity:.5" : ""}">Upload</span>
      </div>
    </div>`,
    { h: 900 },
  );
}
