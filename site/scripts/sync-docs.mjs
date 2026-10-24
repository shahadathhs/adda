// Copies the repo's engineering docs into the site, so there is one source of truth.
//   node scripts/sync-docs.mjs          write content/docs/_generated/*
//   node scripts/sync-docs.mjs --check  fail if the committed copies are out of date
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoDocs = join(here, "..", "..", "docs");
const out = join(here, "..", "content", "docs", "_generated");
const REPO = "https://github.com/shahadathhs/adda/blob/dev";

// source file → [site slug, description]
const SYNCED = {
  "ARCHITECTURE.md": [
    "architecture",
    "How the services, the streaming path, realtime and the code fit together.",
  ],
  "OPERATIONS.md": ["operations", "Install, configure, watch, back up and upgrade a server."],
  "CHAT.md": [
    "chat",
    "The chat data model, the WebSocket protocol, the REST endpoints and the rules.",
  ],
};

const check = process.argv.includes("--check");
if (!existsSync(repoDocs)) {
  // Building from a checkout without the repo's docs/ (the committed copies are used as is).
  console.log("sync-docs: ../docs not found, using the committed copies");
  process.exit(0);
}
mkdirSync(out, { recursive: true });

let stale = 0;
for (const [file, [slug, description]] of Object.entries(SYNCED)) {
  let text = readFileSync(join(repoDocs, file), "utf8");
  const title = /^# (.+)$/m.exec(text)?.[1].replace(/^adda — /, "") ?? slug;
  text = text.replace(/^# .+\n+/, "");
  // Links to other synced docs become site links; the rest point at the repository.
  text = text.replace(/\]\(([A-Za-z]+\.md)(#[^)]*)?\)/g, (_m, f, hash = "") => {
    const target = SYNCED[f];
    return target ? `](/docs/${target[0]}${hash})` : `](${REPO}/docs/${f}${hash})`;
  });
  text = text.replace(/\]\(design\/([^)]+)\)/g, `](${REPO}/docs/design/$1)`);
  const body = `---\ntitle: ${JSON.stringify(title)}\ndescription: ${JSON.stringify(description)}\n---\n\n${text}`;
  const dest = join(out, `${slug}.md`);
  if (check) {
    if (!existsSync(dest) || readFileSync(dest, "utf8") !== body) {
      console.error(`sync-docs: ${slug}.md is out of date. Run: pnpm -C site sync-docs`);
      stale++;
    }
  } else {
    writeFileSync(dest, body);
  }
}
if (check && stale) process.exit(1);
console.log(check ? "sync-docs: up to date" : "sync-docs: written");
