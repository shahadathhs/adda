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
