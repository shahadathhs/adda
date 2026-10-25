/** Broadcast arcs, the brand mark enlarged and faded, behind the right edge of the hero. */
export function HeroArcs() {
  const arc = (r: number, o: number) => {
    const d = r * 0.707;
    return (
      <g
        key={r}
        className="stroke-primary"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
        opacity={o}
      >
        <path d={`M ${160 - d} ${160 - d} A ${r} ${r} 0 0 0 ${160 - d} ${160 + d}`} />
        <path d={`M ${160 + d} ${160 - d} A ${r} ${r} 0 0 1 ${160 + d} ${160 + d}`} />
      </g>
    );
  };
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 hidden overflow-hidden rounded-lg lg:block"
    >
      <svg
        viewBox="0 0 320 320"
        className="absolute -right-10 top-1/2 h-[300px] w-[300px] -translate-y-1/2 overflow-visible"
      >
        {arc(140, 0.1)}
        {arc(100, 0.2)}
        {arc(60, 0.4)}
        <circle cx="160" cy="160" r="14" className="fill-primary" opacity="0.8" />
      </svg>
    </div>
  );
}
