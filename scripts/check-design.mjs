#!/usr/bin/env node
// Design gate: scans UI source for the "default generated UI" tells banned by
// /DESIGN.md (§8–9). Errors fail the run; warnings are printed for review.
// Usage: node scripts/check-design.mjs [dir ...]   (default: web/src site/src)
import { readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join, relative } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const targets = process.argv.slice(2).length ? process.argv.slice(2) : ["web/src", "site/src"];
const EXT = new Set([".tsx", ".ts", ".astro", ".css", ".md", ".mdx"]);
// Token definitions legitimately contain raw hex.
const TOKEN_FILES = new Set(["web/src/app/globals.css", "site/src/styles/theme.css"]);

/** [severity, label, regex, hint] */
const RULES = [
  [
    "error",
    "purple/violet palette",
    /\b(?:bg|text|border|from|to|via|ring|fill|stroke)-(?:purple|violet|indigo|fuchsia)-\d+|#8b5cf6|#9146ff|hsl\(\s*26\d/i,
    "banned hue — use marigold accent",
  ],
  [
    "error",
    "radius off the scale",
    /\brounded-(?:xl|2xl|3xl)\b/,
    "radii are 4/6/8px (xs/sm/md/lg) or pill",
  ],
  [
    "error",
    "opaque drop shadow",
    /\bshadow-(?:lg|xl|2xl)\b/,
    "separate surfaces with the ink ladder + 1px border",
  ],
  [
    "error",
    "gradient",
    /\bbg-gradient-|\bbg-linear-|\bbg-clip-text\b|linear-gradient\(/,
    "no gradients / gradient text",
  ],
  ["error", "glass blur", /\bbackdrop-blur/, "no glassmorphism"],
  [
    "error",
    "white text on accent fill",
    /bg-primary(?![-/\w]).*\btext-white\b|\btext-white\b.*bg-primary(?![-/\w])/,
    "accent fills carry ink (text-primary-foreground)",
  ],
  [
    "error",
    "animating everything",
    /\btransition-all\b/,
    "list properties; only transform/opacity animate",
  ],
  [
    "error",
    "layout-property transition",
    /transition-\[[^\]]*(?:width|height|top|left|right|bottom|margin|padding)/,
    "animate transform/opacity only",
  ],
  ["warn", "raw hex colour in component", /#[0-9a-fA-F]{6}\b/, "use a design token"],
  [
    "warn",
    "Inter font",
    /font-family:[^;]*\bInter\b|\bfont-inter\b/i,
    "type pairing is Space Grotesk + system",
  ],
  [
    "warn",
    "placeholder content",
    /\b(?:John Doe|Jane Doe|Acme|Lorem ipsum)\b/i,
    "use realistic, product-specific copy",
  ],
  ["warn", "emoji as icon", /[\u{1F300}-\u{1FAFF}]/u, "use lucide icons"],
];

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    if (["node_modules", ".next", ".astro", "dist"].includes(name)) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* walk(p);
    else if (EXT.has(extname(p))) yield p;
  }
}

let errors = 0;
let warnings = 0;
for (const t of targets) {
  for (const file of walk(join(ROOT, t))) {
    const rel = relative(ROOT, file);
    const tokenFile = TOKEN_FILES.has(rel);
    readFileSync(file, "utf8")
      .split("\n")
      .forEach((line, i) => {
        if (line.includes("design-ok")) return; // explicit, reviewed exception
        for (const [sev, label, re, hint] of RULES) {
          // Raw hex is only policed in the app; the site's UI mocks replicate it.
          if (label === "raw hex colour in component" && (tokenFile || !rel.startsWith("web/")))
            continue;
          if (rel.endsWith(".md") && sev === "warn") continue;
          if (!re.test(line)) continue;
          sev === "error" ? errors++ : warnings++;
          console.log(`${sev === "error" ? "ERROR" : "warn "} ${rel}:${i + 1}  ${label} — ${hint}`);
        }
      });
  }
}
console.log(`\n${errors} error(s), ${warnings} warning(s)`);
process.exit(errors ? 1 : 0);
