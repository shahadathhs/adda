#!/usr/bin/env node
// Draws the blog thumbnails: one flat 1200x630 illustration per post in the brand colours,
// written to public/blog/<slug>.svg, plus a .png beside it for social previews when Chrome
// is available (set CHROME_BIN if it is not at the macOS default path).
//   node scripts/make-blog-art.mjs [slug ...]
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const OUT = new URL("../public/blog/", import.meta.url).pathname;
const CHROME =
  process.env.CHROME_BIN ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

// Tokens from docs/DESIGN.md: the ink ladder, one marigold accent, a red only for live.
const C = {
  bg: "#0c0d10",
  panel: "#14161b",
  raised: "#1c1f26",
  line: "#262a33",
  mute: "#676e7c",
  soft: "#9aa1af",
  fg: "#edeef2",
  gold: "#f5a623",
  live: "#eb3223",
  ok: "#2fbf71",
};

const box = (x, y, w, h, o = {}) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${o.r ?? 8}" fill="${o.fill ?? C.panel}" stroke="${o.stroke ?? C.line}" stroke-width="${o.sw ?? 2}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ""}/>`;
const bar = (x, y, w, h = 10, fill = C.line) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${Math.min(4, h / 2)}" fill="${fill}"/>`;
const dot = (x, y, r, fill = C.gold, stroke) =>
  `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"${stroke ? ` stroke="${stroke}" stroke-width="2"` : ""}/>`;
const line = (d, stroke = C.mute, w = 3, extra = "") =>
  `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
const arrow = (x1, y1, x2, y2, stroke = C.mute) => {
  const a = Math.atan2(y2 - y1, x2 - x1);
  const h = (d) => [x2 - 14 * Math.cos(a - d), y2 - 14 * Math.sin(a - d)].join(" ");
  return (
    line(`M${x1} ${y1} L${x2} ${y2}`, stroke, 3) +
    line(`M${h(0.5)} L${x2} ${y2} L${h(-0.5)}`, stroke, 3)
  );
};
const arcs = (cx, cy, radii, stroke = C.gold, w = 6) =>
  radii
    .map((r, i) => {
      const d = r * 0.707;
      const o = 1 - i * 0.28;
      return `<g opacity="${o}">${line(`M${cx - d} ${cy - d} A${r} ${r} 0 0 0 ${cx - d} ${cy + d}`, stroke, w)}${line(`M${cx + d} ${cy - d} A${r} ${r} 0 0 1 ${cx + d} ${cy + d}`, stroke, w)}</g>`;
    })
    .join("");
const bubble = (x, y, w, mine = false) =>
  `${box(x, y, w, 56, { r: 8, fill: mine ? "#2a2112" : C.panel, stroke: mine ? C.gold : C.line })}${bar(x + 18, y + 16, w * 0.55, 9, mine ? C.gold : C.mute)}${bar(x + 18, y + 33, w * 0.35, 9, C.line)}`;
const check = (x, y, c = C.ok) =>
  `${dot(x, y, 18, "none", c)}${line(`M${x - 8} ${y} L${x - 2} ${y + 7} L${x + 9} ${y - 8}`, c, 4)}`;

const motifs = {
  // OBS -> server -> viewer, with the broadcast arcs
  "rtmp-in-hls-out-one-auth-webhook": () => `
    ${arcs(600, 250, [60, 110, 160])}${dot(600, 250, 16)}
    ${box(110, 380, 240, 130)}${bar(150, 420, 120, 12, C.mute)}${bar(150, 450, 80, 10)}${dot(310, 470, 9, C.live)}
    ${box(480, 380, 240, 130, { stroke: C.gold })}${bar(520, 420, 140, 12, C.gold)}${bar(520, 450, 90, 10)}
    ${box(850, 380, 240, 130)}${bar(890, 420, 120, 12, C.mute)}${bar(890, 450, 100, 10)}
    ${arrow(350, 445, 480, 445, C.gold)}${arrow(720, 445, 850, 445, C.gold)}
    ${line("M600 380 V300", C.line, 3, 'stroke-dasharray="6 8"')}`,
  // a file arriving in parts
  "video-uploads-resumable-and-direct-play": () => `
    ${box(160, 120, 880, 250, { r: 8 })}
    ${dot(600, 245, 46, C.raised)}${line("M588 222 L588 268 L628 245 Z", C.gold, 5)}
    ${bar(200, 336, 800, 10, C.line)}${bar(200, 336, 520, 10, C.gold)}
    ${Array.from({ length: 10 }, (_, i) => `<rect x="${160 + i * 90}" y="440" width="76" height="70" rx="6" fill="${i < 6 ? C.gold : C.panel}" stroke="${i < 6 ? C.gold : C.line}" stroke-width="2" opacity="${i === 6 ? 0.5 : 1}"/>`).join("")}`,
  // saved first, then fanned out
  "chat-saved-first-then-fanned-out": () => `
    ${box(90, 250, 190, 150)}${line("M90 290 H280", C.line, 2)}${bar(125, 320, 120, 10, C.gold)}${bar(125, 345, 90, 10)}${bar(125, 370, 110, 10)}
    ${box(400, 250, 190, 150, { stroke: C.gold })}${bar(440, 305, 110, 12, C.gold)}${bar(440, 335, 70, 10)}
    ${arrow(280, 325, 400, 325, C.gold)}
    ${[130, 290, 450].map((y, i) => `${box(760, y, 340, 100)}${bubble(780, y + 22, 200, i === 1)}`).join("")}
    ${arrow(590, 325, 760, 180)}${arrow(590, 325, 760, 340)}${arrow(590, 325, 760, 500)}`,
  // a hidden name that is still recorded
  "anonymous-chat-still-accountable": () => `
    ${box(120, 110, 960, 110)}${dot(190, 165, 30, C.gold)}${bar(250, 140, 150, 14, C.gold)}${bar(250, 170, 480, 12)}
    ${box(120, 250, 960, 110)}${dot(190, 305, 30, "none", C.mute)}${line("M170 305 H210", C.mute, 4)}${bar(250, 280, 190, 14, C.mute)}${bar(250, 310, 380, 12)}
    ${box(120, 420, 960, 110, { dash: "10 8", stroke: C.gold })}
    ${dot(190, 475, 30, C.raised)}${line("M168 475 Q190 450 212 475 Q190 500 168 475 Z", C.gold, 4)}${dot(190, 475, 6, C.gold)}
    ${bar(250, 450, 300, 14, C.gold)}${bar(250, 480, 240, 12)}${bar(900, 462, 120, 12, C.mute)}`,
  // tallies that can be rebuilt
  "polls-that-survive-a-redis-restart": () => `
    ${box(150, 90, 900, 450)}
    ${[
      ["500", C.gold],
      ["330", C.mute],
      ["220", C.mute],
      ["110", C.line],
    ]
      .map(
        ([w, f], i) =>
          `${bar(210, 150 + i * 90, 640, 14, C.raised)}${bar(210, 150 + i * 90, Number(w) + 100, 14, f)}${dot(910, 157 + i * 90, 14, "none", f)}`,
      )
      .join("")}
    ${dot(930, 480, 32, "none", C.gold)}${line("M930 480 V460 M930 480 L946 490", C.gold, 4)}`,
  // six gates in a fixed order
  "six-chat-rules-in-a-fixed-order": () => `
    ${box(100, 60, 220, 56, { r: 8, fill: "#2a2112", stroke: C.gold })}${bar(124, 82, 120, 10, C.gold)}
    ${[0, 1, 2, 3, 4, 5].map((i) => `${box(430, 60 + i * 86, 460 - i * 30, 62)}${bar(462, 86 + i * 86, 160 - i * 8, 10, i === 3 ? C.gold : C.mute)}${check(430 + 460 - i * 30 - 38, 91 + i * 86, i === 3 ? C.gold : C.ok)}`).join("")}
    ${arrow(320, 88, 430, 91, C.gold)}${line("M330 150 V540", C.line, 3, 'stroke-dasharray="4 10"')}`,
  // tests passing against two servers
  "testing-a-streaming-platform-on-a-laptop": () => `
    ${[0, 1, 2, 3].map((i) => `${box(110, 90 + i * 110, 520, 80)}${check(160, 130 + i * 110, i === 2 ? C.gold : C.ok)}${bar(210, 118 + i * 110, 260 - i * 20, 12, C.mute)}${bar(210, 142 + i * 110, 180, 9)}`).join("")}
    ${box(740, 110, 170, 120)}${box(940, 110, 170, 120)}${box(840, 380, 170, 120, { stroke: C.gold })}
    ${bar(765, 140, 90, 10, C.mute)}${bar(965, 140, 90, 10, C.mute)}${bar(865, 410, 90, 10, C.gold)}
    ${line("M825 230 V300 H925 V380", C.gold, 3)}${line("M1025 230 V300 H925", C.gold, 3)}`,
  // a terminal, a lock
  "one-command-to-a-live-server": () => `
    ${box(120, 90, 960, 450)}${line("M120 150 H1080", C.line, 2)}${dot(165, 120, 8, C.mute)}${dot(195, 120, 8, C.mute)}${dot(225, 120, 8, C.mute)}
    <text x="170" y="225" font-family="ui-monospace,Menlo,monospace" font-size="44" fill="${C.gold}">$</text>${bar(230, 200, 560, 18, C.soft)}
    ${bar(170, 280, 420, 12)}${bar(170, 320, 340, 12)}${bar(170, 360, 480, 12)}
    <rect x="170" y="420" width="26" height="44" rx="3" fill="${C.gold}"/>
    ${box(800, 330, 200, 170, { stroke: C.gold })}${line("M850 380 V360 Q900 310 950 360 V380", C.gold, 6)}${box(840, 380, 120, 90, { r: 8, fill: C.gold, stroke: C.gold })}${dot(900, 420, 12, C.bg)}`,
  // archives and a way back
  "backups-you-have-restored": () => `
    ${[0, 1, 2].map((i) => `${box(190 + i * 28, 130 + i * 70, 420, 120, { stroke: i === 2 ? C.gold : C.line })}${bar(230 + i * 28, 170 + i * 70, 220, 12, i === 2 ? C.gold : C.mute)}${bar(230 + i * 28, 200 + i * 70, 140, 10)}${dot(560 + i * 28, 190 + i * 70, 12, i === 2 ? C.gold : C.line)}`).join("")}
    ${line("M900 220 A110 110 0 1 1 790 330", C.gold, 8)}${line("M900 220 L870 200 M900 220 L918 250", C.gold, 8)}
    ${bar(800, 470, 220, 12, C.mute)}`,
  // cards, pages
  "search-and-pagination-at-self-hosted-scale": () => `
    ${box(100, 70, 1000, 64, { r: 8 })}${dot(142, 102, 14, "none", C.mute)}${bar(180, 96, 280, 12)}
    ${Array.from({ length: 8 }, (_, i) => {
      const x = 100 + (i % 4) * 255,
        y = 170 + Math.floor(i / 4) * 170;
      return `${box(x, y, 235, 150, { stroke: i === 1 ? C.gold : C.line })}${bar(x + 18, y + 18, 199, 70, C.raised)}${bar(x + 18, y + 108, 120, 12, i === 1 ? C.gold : C.mute)}`;
    }).join("")}
    ${[0, 1, 2, 3].map((i) => `${box(470 + i * 66, 530, 52, 52, { r: 6, fill: i === 0 ? C.raised : C.panel, stroke: i === 0 ? C.gold : C.line })}`).join("")}`,
  // swatches and radii
  "a-palette-with-one-accent-and-one-red": () => `
    ${[C.bg, C.panel, C.raised, C.line, C.mute, C.soft].map((c, i) => `<rect x="${110 + i * 150}" y="90" width="130" height="190" rx="8" fill="${c}" stroke="${C.line}" stroke-width="2"/>`).join("")}
    <rect x="110" y="320" width="440" height="190" rx="8" fill="${C.gold}"/>${bar(150, 380, 200, 16, C.bg)}${bar(150, 420, 140, 12, "#6b4a0c")}
    <rect x="590" y="320" width="130" height="190" rx="8" fill="${C.live}"/>${dot(655, 415, 14, "#fff")}
    ${[4, 6, 8].map((r, i) => `<rect x="${780 + i * 105}" y="360" width="90" height="90" rx="${r}" fill="${C.panel}" stroke="${C.gold}" stroke-width="3"/>`).join("")}`,
  // a bell, once an hour
  "the-bell-and-the-one-email-an-hour": () => `
    ${line("M470 400 V300 Q470 190 600 190 Q730 190 730 300 V400 L770 440 H430 Z", C.gold, 8)}${line("M570 480 Q600 520 630 480", C.gold, 8)}${dot(710, 205, 22, C.gold, C.bg)}
    ${dot(900, 330, 120, "none", C.line)}${line("M900 330 V250 M900 330 L960 365", C.mute, 6)}${dot(900, 330, 10, C.gold)}
    ${box(130, 420, 250, 90)}${bar(165, 452, 150, 12, C.mute)}${bar(165, 478, 100, 10)}`,
};

const svg = (inner) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630"><rect width="1200" height="630" fill="${C.bg}"/>${inner()}</svg>\n`;

mkdirSync(OUT, { recursive: true });
const only = process.argv.slice(2);
const work = mkdtempSync(join(tmpdir(), "adda-blog-art-"));
for (const [slug, draw] of Object.entries(motifs)) {
  if (only.length && !only.includes(slug)) continue;
  const file = join(OUT, `${slug}.svg`);
  writeFileSync(file, svg(draw));
  try {
    const page = join(work, `${slug}.html`);
    writeFileSync(
      page,
      `<body style="margin:0;background:${C.bg}"><img src="${pathToFileURL(file).href}" width="1200" height="630" style="display:block"></body>`,
    );
    execFileSync(
      CHROME,
      [
        "--headless=new",
        "--disable-gpu",
        "--hide-scrollbars",
        "--window-size=1200,630",
        "--force-device-scale-factor=1",
        `--screenshot=${join(OUT, `${slug}.png`)}`,
        pathToFileURL(page).href,
      ],
      { stdio: "ignore" },
    );
  } catch {
    console.warn(`no png for ${slug} (Chrome not found)`);
  }
  console.log(slug);
}
