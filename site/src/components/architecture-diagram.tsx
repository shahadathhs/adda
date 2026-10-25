"use client";

import { useState } from "react";
import { useReducedMotion } from "motion/react";
import * as m from "motion/react-m";

type Node = { x: number; y: number; title: string; sub: string; note: string };

const W = 170;
const H = 64;
const nodes: Node[] = [
  {
    x: 0,
    y: 28,
    title: "OBS",
    sub: "your encoder",
    note: "Your encoder. It publishes RTMP to the server with the channel's stream key.",
  },
  {
    x: 0,
    y: 328,
    title: "Viewers",
    sub: "browsers",
    note: "Browsers. They watch HLS and use the web app and the API over HTTPS.",
  },
  {
    x: 250,
    y: 328,
    title: "Caddy",
    sub: "automatic HTTPS",
    note: "Gets certificates by itself and routes the web app, /api, /ws and the /hls playback path.",
  },
  {
    x: 520,
    y: 28,
    title: "mediamtx",
    sub: "RTMP · HLS · recordings",
    note: "Takes RTMP in, writes HLS for viewers and MP4 recordings to disk, and asks the backend to approve every publish.",
  },
  {
    x: 520,
    y: 178,
    title: "Backend",
    sub: "FastAPI · REST · WebSocket",
    note: "FastAPI: the REST API, the WebSocket gateway, the stream monitor and video preparation.",
  },
  {
    x: 520,
    y: 328,
    title: "Web",
    sub: "Next.js",
    note: "Next.js: server-rendered browse and channel pages, and the client app for everything signed in.",
  },
  {
    x: 830,
    y: 28,
    title: "Postgres",
    sub: "accounts · chat · videos",
    note: "The record: accounts, channels, messages, polls, videos and the moderation log.",
  },
  {
    x: 830,
    y: 328,
    title: "Redis",
    sub: "fan-out · presence · limits",
    note: "Speed, not truth: fan-out between backend instances, presence, rate limits and live poll tallies.",
  },
];

type Head = { x: number; y: number; angle: number };
type Link = {
  id: string;
  nodes: [string, string];
  paths: string[];
  heads: Head[];
  order: number;
  accent?: boolean;
  label?: { text: string; x: number; y: number; anchor?: "start" | "middle" };
};

/** Every connection, in the order the data travels: the video path first, then the requests. */
const links: Link[] = [
  {
    id: "rtmp",
    nodes: ["OBS", "mediamtx"],
    paths: ["M170 48 H520"],
    heads: [{ x: 520, y: 48, angle: 0 }],
    order: 0,
    accent: true,
    label: { text: "RTMP", x: 345, y: 40 },
  },
  {
    id: "hls",
    nodes: ["mediamtx", "Caddy"],
    paths: ["M520 76 H300 V328"],
    heads: [{ x: 300, y: 328, angle: 90 }],
    order: 1,
    accent: true,
    label: { text: "HLS", x: 410, y: 68 },
  },
  {
    id: "https",
    nodes: ["Viewers", "Caddy"],
    paths: ["M170 360 H250"],
    heads: [
      { x: 170, y: 360, angle: 180 },
      { x: 250, y: 360, angle: 0 },
    ],
    order: 2,
    label: { text: "HTTPS", x: 210, y: 350 },
  },
  {
    id: "api",
    nodes: ["Caddy", "Backend"],
    paths: ["M370 328 V210 H520"],
    heads: [
      { x: 370, y: 328, angle: 90 },
      { x: 520, y: 210, angle: 0 },
    ],
    order: 3,
    label: { text: "/api · /ws", x: 445, y: 200 },
  },
  {
    id: "pages",
    nodes: ["Caddy", "Web"],
    paths: ["M420 360 H520"],
    heads: [
      { x: 420, y: 360, angle: 180 },
      { x: 520, y: 360, angle: 0 },
    ],
    order: 3,
    label: { text: "pages", x: 470, y: 350 },
  },
  {
    id: "webhook",
    nodes: ["mediamtx", "Backend"],
    paths: ["M605 92 V178"],
    heads: [{ x: 605, y: 178, angle: 90 }],
    order: 4,
    label: { text: "auth webhook", x: 617, y: 140, anchor: "start" },
  },
  {
    id: "postgres",
    nodes: ["Backend", "Postgres"],
    paths: ["M690 210 H760 V60 H830"],
    heads: [
      { x: 690, y: 210, angle: 180 },
      { x: 830, y: 60, angle: 0 },
    ],
    order: 5,
  },
  {
    id: "redis",
    nodes: ["Backend", "Redis"],
    paths: ["M690 210 H760 V360 H830"],
    heads: [
      { x: 690, y: 210, angle: 180 },
      { x: 830, y: 360, angle: 0 },
    ],
    order: 5,
  },
  {
    id: "ssr",
    nodes: ["Web", "Backend"],
    paths: ["M605 328 V242"],
    heads: [{ x: 605, y: 242, angle: -90 }],
    order: 6,
    label: { text: "server-side fetch", x: 617, y: 290, anchor: "start" },
  },
];

const label =
  "fill-muted-foreground font-num text-[11px] [paint-order:stroke] stroke-background stroke-[5px]";

/** A line that draws itself in; `order` places it in the story. */
const draw = (order: number) => ({
  hidden: { pathLength: 0, opacity: 0 },
  show: {
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: { duration: 0.55, delay: 0.15 + order * 0.28, ease: "easeInOut" as const },
      opacity: { duration: 0.01, delay: 0.15 + order * 0.28 },
    },
  },
});
const fade = (order: number) => ({
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.3, delay: 0.3 + order * 0.28 } },
});

const HINT = "Hover or focus a box to see what it does and what it talks to.";

/**
 * How the pieces connect: the video path in marigold, everything else quiet. On entering view the
 * lines draw in the order the data travels. Hover or focus a box and only its connections stay lit,
 * with a note on what it does.
 */
export function ArchitectureDiagram() {
  const reduce = useReducedMotion();
  const [active, setActive] = useState<string | null>(null);

  const linked = (l: Link) => active === null || l.nodes.includes(active);
  const reach = new Set(active ? [active, ...links.filter(linked).flatMap((l) => l.nodes)] : []);
  const dim = "transition-opacity duration-150 motion-reduce:transition-none";
  const current = nodes.find((n) => n.title === active);

  return (
    <div className="mt-8 overflow-hidden rounded-lg border border-border bg-card">
      <div className="overflow-x-auto">
        <m.svg
          initial={reduce ? "show" : "hidden"}
          whileInView="show"
          viewport={{ once: true, amount: 0.35 }}
          viewBox="-24 0 1048 420"
          role="group"
          aria-labelledby="arch-title arch-desc"
          className="mx-auto block h-auto w-full min-w-[760px] max-w-[1100px]"
        >
          <title id="arch-title">How adda fits together</title>
          <desc id="arch-desc">
            OBS publishes RTMP to mediamtx, which asks the backend to authorise it and serves HLS
            through Caddy to viewers. Viewers reach the web app and the backend through Caddy. The
            backend uses Postgres for records and Redis for fan-out, presence and rate limits.
          </desc>

          {links.map((l) => (
            <g key={l.id} className={dim} style={{ opacity: linked(l) ? 1 : 0.18 }}>
              {l.paths.map((d) => (
                <m.path
                  key={d}
                  data-draw
                  variants={draw(l.order)}
                  d={d}
                  fill="none"
                  strokeWidth={l.accent ? 2 : 1.5}
                  className={l.accent ? "stroke-primary" : "stroke-muted-foreground"}
                />
              ))}
              {l.heads.map((h) => (
                <m.path
                  key={`${h.x}-${h.y}`}
                  data-draw
                  variants={fade(l.order + 1.4)}
                  d="M-10 -5.5 L0 0 L-10 5.5 z"
                  transform={`translate(${h.x} ${h.y}) rotate(${h.angle})`}
                  className={l.accent ? "fill-primary" : "fill-muted-foreground"}
                />
              ))}
              {l.label && (
                <m.text
                  variants={fade(l.order)}
                  x={l.label.x}
                  y={l.label.y}
                  textAnchor={l.label.anchor ?? "middle"}
                  className={label}
                >
                  {l.label.text}
                </m.text>
              )}
            </g>
          ))}

          {nodes.map((n) => {
            const on = active === n.title;
            const quiet = active !== null && !reach.has(n.title);
            return (
              <g
                key={n.title}
                role="img"
                aria-label={`${n.title}: ${n.note}`}
                tabIndex={0}
                onMouseEnter={() => setActive(n.title)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(n.title)}
                onBlur={() => setActive(null)}
                onClick={() => setActive((a) => (a === n.title ? null : n.title))}
                className={`cursor-default outline-none ${dim}`}
                style={{ opacity: quiet ? 0.3 : 1 }}
              >
                <rect
                  x={n.x}
                  y={n.y}
                  width={W}
                  height={H}
                  rx="6"
                  className={`fill-background transition-[stroke] duration-150 ${on ? "stroke-primary" : "stroke-border"}`}
                  strokeWidth={on ? 2 : 1}
                />
                <text
                  x={n.x + W / 2}
                  y={n.y + 28}
                  textAnchor="middle"
                  className="fill-foreground font-display text-[16px] font-semibold"
                >
                  {n.title}
                </text>
                <text
                  x={n.x + W / 2}
                  y={n.y + 47}
                  textAnchor="middle"
                  className="fill-muted-foreground text-[11px]"
                >
                  {n.sub}
                </text>
              </g>
            );
          })}
        </m.svg>
      </div>
      <p
        aria-live="polite"
        className="min-h-[3.25rem] border-t border-border px-5 py-3 text-sm leading-6 text-muted-foreground"
      >
        {current ? (
          <>
            <span className="font-semibold text-foreground">{current.title}.</span> {current.note}
          </>
        ) : (
          HINT
        )}
      </p>
    </div>
  );
}
