import Link from "next/link";
import { GlobalSearch } from "@/components/search/global-search";
import { HeroArcs } from "@/components/home/hero-arcs";

/** The top of the home page: one search for everything, and shortcuts to the three directories. */
export function HomeHero({ live, channels }: { live: number; channels: number }) {
  const chip =
    "inline-flex items-center gap-2 rounded-sm border border-border bg-background px-3 py-1.5 text-[13px] text-muted-foreground outline-none transition-colors duration-120 hover:border-muted-foreground/40 hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring";

  return (
    <section
      aria-labelledby="hero-heading"
      className="relative rounded-lg border border-border bg-card px-5 py-8 sm:px-8 sm:py-10"
    >
      <HeroArcs />
      <div className="relative max-w-[640px]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          adda
        </p>
        <h1
          id="hero-heading"
          className="mt-1.5 font-display text-[32px] font-bold leading-10 tracking-tight text-foreground sm:text-4xl sm:leading-[44px]"
        >
          Find a stream, a channel or a recording.
        </h1>
        <GlobalSearch size="hero" className="mt-6" />
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/live" className={chip}>
            <span className="h-1.5 w-1.5 rounded-full bg-live" aria-hidden="true" />
            Live now <span className="font-num text-foreground">{live}</span>
          </Link>
          <Link href="/channels" className={chip}>
            Channels <span className="font-num text-foreground">{channels}</span>
          </Link>
          <Link href="/videos" className={chip}>
            Videos
          </Link>
          <Link href="/recordings" className={chip}>
            Recordings
          </Link>
        </div>
      </div>
    </section>
  );
}
