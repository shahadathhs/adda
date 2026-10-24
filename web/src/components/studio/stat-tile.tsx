/** One number from the live monitor: an eyebrow label over a mono value. */
export function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-card px-4 py-3.5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </p>
      <p
        className={`mt-1 font-num font-bold leading-7 text-foreground ${value.length > 8 ? "text-base" : "text-[22px]"}`}
      >
        {value}
      </p>
    </div>
  );
}
