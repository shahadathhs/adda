"use client";

import { useStreamStatus } from "@/lib/data";
import { cn } from "@/lib/cn";

const STEPS = [
  { title: "Open OBS → Settings → Stream", body: "Choose “Custom…” as the service." },
  { title: "Paste the server URL and stream key", body: "From the panel on the left." },
  {
    title: "Output: keyframe interval 2 s, x264 or hardware H.264, AAC audio",
    body: "This keeps the stream playable in browsers.",
  },
  { title: "Press Start Streaming", body: "Your channel goes live in a few seconds." },
];

/** The four OBS steps, and whether the encoder has connected yet. */
export function StepsPanel({ channelId }: { channelId: string }) {
  const { data: status } = useStreamStatus(channelId);
  const live = !!status?.is_live;
  return (
    <section className="rounded-md border border-border bg-card p-5">
      <h2 className="font-display text-base font-semibold text-foreground">
        Go live in four steps
      </h2>
      <ol className="mt-3">
        {STEPS.map((s, i) => (
          <li key={s.title} className="flex gap-3 border-b border-border py-3 last:border-b-0">
            <span
              className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary-subtle font-num text-xs font-semibold text-primary"
              aria-hidden="true"
            >
              {i + 1}
            </span>
            <div>
              <p className="text-sm font-semibold text-foreground">{s.title}</p>
              <p className="text-[13px] text-muted-foreground">{s.body}</p>
            </div>
          </li>
        ))}
      </ol>
      <p
        role="status"
        className="mt-1 flex items-center gap-2.5 rounded-md border border-border bg-background px-3.5 py-2.5 text-[13px] text-foreground"
      >
        <span
          className={cn("h-2 w-2 rounded-full", live ? "bg-ok" : "bg-muted-foreground")}
          aria-hidden="true"
        />
        {live ? "Encoder connected. You are live." : "Waiting for your encoder…"}
      </p>
    </section>
  );
}
