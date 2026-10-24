import { icons } from "../components.mjs";
import { studioShell } from "../shells.mjs";

const step = (n, t, d) =>
  `<div class="row" style="align-items:flex-start;padding:12px 0;border-bottom:1px solid var(--line)"><div class="mono" style="width:22px;height:22px;border-radius:50%;background:var(--accent-subtle);color:var(--accent);display:grid;place-items:center;font-size:12px;font-weight:600;flex-shrink:0">${n}</div><div><div style="font-weight:600">${t}</div><div class="muted" style="font-size:13px;margin-top:2px">${d}</div></div></div>`;

export default {
  w: 1440,
  h: 900,
  html: studioShell(
    "Setup",
    `<div style="display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,1fr);gap:24px">
    <div class="panel">
      <h2 class="h3">Connect your encoder</h2><p class="muted" style="font-size:13px;margin-top:2px">Paste these into OBS. They identify your channel to the server.</p>
      <div style="margin-top:16px"><label class="l">Server (RTMP URL)</label><div class="keybox"><span>rtmp://live.nilaworkshop.example/live</span>${icons.copy(15)}</div></div>
      <div style="margin-top:14px"><label class="l">Stream key</label><div class="keybox"><span>••••••••••••••••••••••••••••••</span><span style="display:flex;gap:12px">${icons.eyeoff(15)}${icons.copy(15)}</span></div>
        <div class="help">Anyone with this key can broadcast as you. Never share it in chat.</div></div>
      <div class="sep"></div>
      <div class="row"><div style="flex:1"><div style="font-weight:600">Rotate stream key</div><div class="muted" style="font-size:13px">Disconnects any encoder using the current key.</div></div><span class="btn secondary">Rotate key</span></div>
    </div>
    <div class="panel">
      <h2 class="h3">Go live in four steps</h2>
      ${step(1, "Open OBS → Settings → Stream", "Choose “Custom…” as the service.")}
      ${step(2, "Paste the server URL and stream key", "From the panel on the left.")}
      ${step(3, "Output: keyframe interval 2 s, x264 or hardware H.264, AAC audio", "This keeps the stream playable in browsers.")}
      ${step(4, "Press Start Streaming", "Your channel goes live in a few seconds.")}
      <div class="banner" style="margin-top:14px"><i class="livedot" style="box-shadow:none;background:var(--fg-subtle)"></i><span>Waiting for your encoder…</span></div>
    </div>
  </div>`,
  ),
};
