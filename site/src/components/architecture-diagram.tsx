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

/** How the pieces connect: the video path in marigold, everything else quiet. */
export function ArchitectureDiagram() {
  return (
    <div className="mt-8 overflow-x-auto rounded-lg border border-border bg-card">
      <svg
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
        <defs>
          {(
            [
              ["end", "muted-foreground"],
              ["endp", "primary"],
            ] as const
          ).map(([id, color]) => (
            <marker
              key={id}
              id={`a-${id}`}
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M0 0 L10 5 L0 10 z" className={`fill-${color}`} />
            </marker>
          ))}
        </defs>

        {/* The video path */}
        <g fill="none" className="stroke-primary" strokeWidth="2" markerEnd="url(#a-endp)">
          <path d="M170 48 H520" />
          <path d="M520 76 H300 V328" />
        </g>

        {/* Requests and answers */}
        <g
          fill="none"
          className="stroke-muted-foreground"
          strokeWidth="1.5"
          markerEnd="url(#a-end)"
          markerStart="url(#a-end)"
        >
          <path d="M170 360 H250" />
          <path d="M370 328 V210 H520" />
          <path d="M420 360 H520" />
          <path d="M690 210 H760 V60 H830" />
          <path d="M690 210 H760 V360 H830" />
        </g>
        <g
          fill="none"
          className="stroke-muted-foreground"
          strokeWidth="1.5"
          markerEnd="url(#a-end)"
        >
          <path d="M605 92 V178" />
          <path d="M605 328 V242" />
        </g>

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

        <text x="345" y="40" textAnchor="middle" className={label}>
          RTMP
        </text>
        <text x="410" y="68" textAnchor="middle" className={label}>
          HLS
        </text>
        <text x="210" y="350" textAnchor="middle" className={label}>
          HTTPS
        </text>
        <text x="470" y="350" textAnchor="middle" className={label}>
          pages
        </text>
        <text x="445" y="200" textAnchor="middle" className={label}>
          /api · /ws
        </text>
        <text x="617" y="140" className={label}>
          auth webhook
        </text>
        <text x="617" y="290" className={label}>
          server-side fetch
        </text>
      </svg>
    </div>
  );
}
