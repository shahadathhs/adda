#!/usr/bin/env node
// Renders the concept screens in docs/design/src/screens/*.mjs to PNGs in
// docs/design/screens/ using headless Chrome. Usage:
//   node scripts/render-design.mjs [screen-id ...]    (e.g. 01-home 02-channel-live)
import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = new URL("..", import.meta.url).pathname;
const SRC = join(ROOT, "docs/design/src");
const OUT = join(ROOT, "docs/design/screens");
const CHROME =
  process.env.CHROME_BIN ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const FONT = pathToFileURL(join(ROOT, "site/public/fonts/space-grotesk-var.woff2")).href;

const only = process.argv.slice(2);
const files = readdirSync(join(SRC, "screens")).filter((f) => f.endsWith(".mjs"));
const css = readFileSync(join(SRC, "ui.css"), "utf8").replace("__FONT__", FONT);
const work = join(tmpdir(), "adda-design-render");
mkdirSync(work, { recursive: true });
mkdirSync(OUT, { recursive: true });

for (const f of files) {
  const id = f.replace(/\.mjs$/, "");
  if (only.length && !only.includes(id)) continue;
  const { default: s } = await import(pathToFileURL(join(SRC, "screens", f)).href);
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body style="width:${s.w}px;height:${s.h}px">${s.html}</body></html>`;
  const htmlPath = join(work, `${id}.html`);
  writeFileSync(htmlPath, html);
  execFileSync(
    CHROME,
    [
      "--headless=new",
      "--disable-gpu",
      "--hide-scrollbars",
      "--force-device-scale-factor=1",
      `--window-size=${s.w},${s.h}`,
      "--virtual-time-budget=3000",
      `--screenshot=${join(OUT, `${id}.png`)}`,
      pathToFileURL(htmlPath).href,
    ],
    { stdio: "ignore" },
  );
  console.log(`rendered ${id}.png (${s.w}x${s.h})`);
}

// Contact sheet of every screen (only when rendering the whole set).
if (!only.length) {
  const shots = readdirSync(OUT)
    .filter((f) => f.endsWith(".png") && f !== "overview.png")
    .sort();
  const tiles = shots
    .map(
      (f) =>
        `<figure><div class="box"><img src="${pathToFileURL(join(OUT, f)).href}"></div><figcaption>${f.replace(/\.png$/, "")}</figcaption></figure>`,
    )
    .join("");
  const cols = 4;
  const rows = Math.ceil(shots.length / cols);
  const w = 1900;
  const h = 80 + rows * 312;
  const sheet = `<!doctype html><meta charset="utf-8"><style>
    body{margin:0;background:#0c0d10;color:#9aa1af;font:12px -apple-system,system-ui,sans-serif;padding:24px;width:${w - 48}px}
    h1{font:700 18px/1 sans-serif;color:#edeef2;margin:0 0 18px}
    .g{display:grid;grid-template-columns:repeat(${cols},1fr);gap:16px}
    .box{height:275px;background:#14161b;border:1px solid #262a33;border-radius:6px;display:grid;place-items:center;overflow:hidden}
    img{height:275px;width:100%;object-fit:contain}figure{margin:0}figcaption{margin-top:6px;font-family:ui-monospace,monospace}
  </style><h1>adda: concept screens</h1><div class="g">${tiles}</div>`;
  const sheetPath = join(work, "overview.html");
  writeFileSync(sheetPath, sheet);
  execFileSync(
    CHROME,
    [
      "--headless=new",
      "--disable-gpu",
      "--hide-scrollbars",
      "--force-device-scale-factor=1",
      `--window-size=${w},${h}`,
      "--virtual-time-budget=4000",
      `--screenshot=${join(ROOT, "docs/design/overview.png")}`,
      pathToFileURL(sheetPath).href,
    ],
    { stdio: "ignore" },
  );
  console.log("rendered overview.png");
}
