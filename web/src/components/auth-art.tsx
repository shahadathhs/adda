/** The brand mark as a scene: a player with its broadcast arcs, a timeline and a chat column. Decorative. */
export function AuthArt() {
  const arc = (r: number, o: number) => {
    const d = r * 0.707;
    return (
      <g
        key={r}
        className="stroke-primary"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
        opacity={o}
      >
        <path d={`M ${140 - d} ${100 - d} A ${r} ${r} 0 0 0 ${140 - d} ${100 + d}`} />
        <path d={`M ${140 + d} ${100 - d} A ${r} ${r} 0 0 1 ${140 + d} ${100 + d}`} />
      </g>
    );
  };
  const rows = [
    { y: 34, w: 64, hot: false },
    { y: 62, w: 48, hot: false },
    { y: 90, w: 72, hot: true },
    { y: 118, w: 40, hot: false },
    { y: 146, w: 60, hot: false },
  ];

  return (
    <svg viewBox="0 0 416 240" aria-hidden="true" className="mb-7 block w-full max-w-[420px]">
      <rect
        x="0.5"
        y="0.5"
        width="415"
        height="239"
        rx="8"
        className="fill-background stroke-border"
      />
      {/* Player */}
      <rect x="16" y="16" width="44" height="18" rx="3" className="fill-live" />
      <circle cx="26" cy="25" r="3" fill="#fff" /> {/* design-ok: white dot on the live badge */}
      <rect x="33" y="22" width="20" height="6" rx="2" fill="#fff" opacity="0.9" />
      {arc(68, 0.25)}
      {arc(48, 0.55)}
      {arc(28, 1)}
      <circle cx="140" cy="100" r="9" className="fill-primary" />
      {/* Timeline with comment markers */}
      <rect x="16" y="198" width="256" height="4" rx="2" className="fill-border" />
      <rect x="16" y="198" width="168" height="4" rx="2" className="fill-primary" />
      {[52, 96, 150, 212].map((x) => (
        <rect
          key={x}
          x={x}
          y="190"
          width="2"
          height="8"
          rx="1"
          className="fill-muted-foreground"
          opacity="0.6"
        />
      ))}
      <rect
        x="16"
        y="214"
        width="46"
        height="6"
        rx="2"
        className="fill-muted-foreground"
        opacity="0.4"
      />
      {/* Chat */}
      <rect x="288" y="16" width="112" height="208" rx="6" className="fill-card stroke-border" />
      {rows.map((r) => (
        <g key={r.y}>
          {r.hot && (
            <rect
              x="294"
              y={r.y - 10}
              width="100"
              height="26"
              rx="4"
              className="fill-primary"
              opacity="0.14"
            />
          )}
          <circle
            cx="304"
            cy={r.y + 3}
            r="5"
            className={r.hot ? "fill-primary" : "fill-muted-foreground"}
            opacity={r.hot ? 1 : 0.5}
          />
          <rect
            x="316"
            y={r.y - 2}
            width="26"
            height="5"
            rx="2"
            className={r.hot ? "fill-primary" : "fill-muted-foreground"}
            opacity={r.hot ? 1 : 0.6}
          />
          <rect
            x="316"
            y={r.y + 7}
            width={r.w}
            height="5"
            rx="2"
            className="fill-muted-foreground"
            opacity="0.3"
          />
        </g>
      ))}
      <rect
        x="296"
        y="196"
        width="96"
        height="20"
        rx="4"
        className="fill-background stroke-border"
      />
      <rect
        x="304"
        y="204"
        width="44"
        height="4"
        rx="2"
        className="fill-muted-foreground"
        opacity="0.3"
      />
    </svg>
  );
}
