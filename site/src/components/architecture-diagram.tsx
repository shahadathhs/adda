"use client";

import { useReducedMotion } from "motion/react";
import * as m from "motion/react-m";

type Node = { x: number; y: number; title: string; sub: string };

const W = 170;
const H = 64;
const nodes: Node[] = [
  { x: 0, y: 28, title: "OBS", sub: "your encoder" },
  { x: 0, y: 328, title: "Viewers", sub: "browsers" },
  { x: 250, y: 328, title: "Caddy", sub: "automatic HTTPS" },
  { x: 520, y: 28, title: "mediamtx", sub: "RTMP · HLS · recordings" },
  { x: 520, y: 178, title: "Backend", sub: "FastAPI · REST · WebSocket" },
  { x: 520, y: 328, title: "Web", sub: "Next.js" },
  { x: 830, y: 28, title: "Postgres", sub: "accounts · chat · videos" },
  { x: 830, y: 328, title: "Redis", sub: "fan-out · presence · limits" },
];

const label =
  "fill-muted-foreground font-num text-[11px] [paint-order:stroke] stroke-background stroke-[5px]";

type Head = { x: number; y: number; angle: number; accent?: boolean; order: number };
/** Arrowheads sit apart from the lines so they can arrive after them (never before). */
const heads: Head[] = [
  { x: 520, y: 48, angle: 0, accent: true, order: 0 },
  { x: 300, y: 328, angle: 90, accent: true, order: 1 },
  { x: 170, y: 360, angle: 180, order: 2 },
  { x: 250, y: 360, angle: 0, order: 2 },
  { x: 370, y: 328, angle: 90, order: 3 },
  { x: 520, y: 210, angle: 0, order: 3 },
  { x: 420, y: 360, angle: 180, order: 3 },
  { x: 520, y: 360, angle: 0, order: 3 },
  { x: 605, y: 178, angle: 90, order: 4 },
  { x: 690, y: 210, angle: 180, order: 5 },
  { x: 830, y: 60, angle: 0, order: 5 },
  { x: 830, y: 360, angle: 0, order: 5 },
  { x: 605, y: 242, angle: -90, order: 6 },
];

/** A line that draws itself in, `order` places it in the story: video first, then the rest. */
const line = (order: number) => ({
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

/**
 * How the pieces connect: the video path in marigold, everything else quiet. When it scrolls into
 * view the lines draw in the order the data travels: RTMP in, HLS out, then the requests.
 */
export function ArchitectureDiagram() {
  const reduce = useReducedMotion();
  return (
    <div className="mt-8 overflow-x-auto rounded-lg border border-border bg-card">
      <m.svg
        initial={reduce ? "show" : "hidden"}
        whileInView="show"
        viewport={{ once: true, amount: 0.35 }}
        viewBox="-24 0 1048 420"
        role="img"
        aria-labelledby="arch-title arch-desc"
        className="mx-auto block h-auto w-full min-w-[760px] max-w-[1100px]"
      >
        <title id="arch-title">How adda fits together</title>
        <desc id="arch-desc">
          OBS publishes RTMP to mediamtx, which asks the backend to authorise it and serves HLS
          through Caddy to viewers. Viewers reach the web app and the backend through Caddy. The
          backend uses Postgres for records and Redis for fan-out, presence and rate limits.
        </desc>

        {/* The video path */}
        <g fill="none" className="stroke-primary" strokeWidth="2">
          <m.path data-draw variants={line(0)} d="M170 48 H520" />
          <m.path data-draw variants={line(1)} d="M520 76 H300 V328" />
        </g>

        {/* Requests and answers */}
        <g fill="none" className="stroke-muted-foreground" strokeWidth="1.5">
          <m.path data-draw variants={line(2)} d="M170 360 H250" />
          <m.path data-draw variants={line(3)} d="M370 328 V210 H520" />
          <m.path data-draw variants={line(3)} d="M420 360 H520" />
          <m.path data-draw variants={line(5)} d="M690 210 H760 V60 H830" />
          <m.path data-draw variants={line(5)} d="M690 210 H760 V360 H830" />
        </g>
        <g fill="none" className="stroke-muted-foreground" strokeWidth="1.5">
          <m.path data-draw variants={line(4)} d="M605 92 V178" />
          <m.path data-draw variants={line(6)} d="M605 328 V242" />
        </g>

        {heads.map((h) => (
          <m.path
            key={`${h.x}-${h.y}-${h.angle}`}
            data-draw
            variants={fade(h.order + 1.4)}
            d="M-10 -5.5 L0 0 L-10 5.5 z"
            transform={`translate(${h.x} ${h.y}) rotate(${h.angle})`}
            className={h.accent ? "fill-primary" : "fill-muted-foreground"}
          />
        ))}

        {nodes.map((n) => (
          <g key={n.title}>
            <rect
              x={n.x}
              y={n.y}
              width={W}
              height={H}
              rx="6"
              className="fill-background stroke-border"
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
        ))}

        <m.text variants={fade(0)} x="345" y="40" textAnchor="middle" className={label}>
          RTMP
        </m.text>
        <m.text variants={fade(1)} x="410" y="68" textAnchor="middle" className={label}>
          HLS
        </m.text>
        <m.text variants={fade(2)} x="210" y="350" textAnchor="middle" className={label}>
          HTTPS
        </m.text>
        <m.text variants={fade(3)} x="470" y="350" textAnchor="middle" className={label}>
          pages
        </m.text>
        <m.text variants={fade(3)} x="445" y="200" textAnchor="middle" className={label}>
          /api · /ws
        </m.text>
        <m.text variants={fade(4)} x="617" y="140" className={label}>
          auth webhook
        </m.text>
        <m.text variants={fade(6)} x="617" y="290" className={label}>
          server-side fetch
        </m.text>
      </m.svg>
    </div>
  );
}
