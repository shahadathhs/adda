"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BarChart3, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { chatState, endPoll, startPoll } from "@/lib/api";
import { mmss, useCountdown } from "@/lib/use-countdown";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/cn";

const DURATIONS = [
  { seconds: 120, label: "2 min" },
  { seconds: 300, label: "5 min" },
  { seconds: 600, label: "10 min" },
];

/** Start a poll (one at a time), or watch and end the one that is open. */
export function PollForm({ communityId }: { communityId: string }) {
  const qc = useQueryClient();
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [seconds, setSeconds] = useState(300);
  const { data: state } = useQuery({
    queryKey: ["chat-state", communityId],
    queryFn: () => chatState(communityId),
  });
  const poll = state?.poll?.status === "open" ? state.poll : null;
  const left = useCountdown(poll?.closes_at ?? null);

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["chat-state", communityId] });
    void qc.invalidateQueries({ queryKey: ["mod-actions", communityId] });
  };
  const start = useMutation({
    mutationFn: () =>
      startPoll(communityId, {
        question: question.trim(),
        options: options.map((o) => o.trim()).filter(Boolean),
        duration_seconds: seconds,
      }),
    onSuccess: () => {
      toast.success("Poll started");
      setQuestion("");
      setOptions(["", ""]);
      refresh();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not start the poll"),
  });
  const end = useMutation({
    mutationFn: () => endPoll(poll!.id),
    onSuccess: () => {
      toast.success("Poll ended");
      refresh();
    },
  });

  const filled = options.filter((o) => o.trim()).length;

  if (poll) {
    return (
      <section className="rounded-md border border-border bg-card p-5">
        <div className="flex items-start justify-between gap-3">
          <h2 className="font-display text-base font-semibold text-foreground">Poll is open</h2>
          <Button variant="outline" disabled={end.isPending} onClick={() => end.mutate()}>
            End poll
          </Button>
        </div>
        <p className="mt-2 text-sm font-semibold text-foreground">{poll.question}</p>
        <ul className="mt-2 space-y-1 text-[13px] text-muted-foreground">
          {poll.options.map((o) => (
            <li key={o.id} className="flex justify-between">
              <span>{o.label}</span>
              <span className="font-num">{o.percent}%</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-muted-foreground">
          <span className="font-num">{poll.total}</span> votes · closes in{" "}
          <span className="font-num">{left === null ? "--:--" : mmss(left)}</span>
        </p>
      </section>
    );
  }

  return (
    <form
      className="space-y-4 rounded-md border border-border bg-card p-5"
      onSubmit={(e) => {
        e.preventDefault();
        start.mutate();
      }}
    >
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-base font-semibold text-foreground">Start a poll</h2>
        <span className="text-[13px] text-muted-foreground">One poll at a time</span>
      </div>
      <Field label="Question" htmlFor="poll-question">
        <Input
          id="poll-question"
          required
          maxLength={200}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        {options.map((value, i) => (
          <Field key={i} label={`Option ${i + 1}`} htmlFor={`poll-option-${i}`}>
            <div className="flex gap-1.5">
              <Input
                id={`poll-option-${i}`}
                required={i < 2}
                maxLength={80}
                value={value}
                onChange={(e) => setOptions(options.map((o, j) => (j === i ? e.target.value : o)))}
              />
              {i >= 2 && (
                <button
                  type="button"
                  aria-label={`Remove option ${i + 1}`}
                  onClick={() => setOptions(options.filter((_, j) => j !== i))}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-sm text-muted-foreground hover:bg-secondary focus-visible:outline-2 focus-visible:outline-ring"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
            </div>
          </Field>
        ))}
        {options.length < 4 && (
          <button
            type="button"
            onClick={() => setOptions([...options, ""])}
            className="flex items-center gap-1.5 self-end pb-2 text-[13px] text-primary hover:underline"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Add option
          </button>
        )}
      </div>
      <div className="flex items-center justify-between gap-3">
        <div
          role="radiogroup"
          aria-label="Poll length"
          className="inline-flex rounded-md border border-border bg-background p-0.5"
        >
          {DURATIONS.map((d) => (
            <button
              key={d.seconds}
              type="button"
              role="radio"
              aria-checked={seconds === d.seconds}
              onClick={() => setSeconds(d.seconds)}
              className={cn(
                "rounded-sm px-2.5 py-1 text-xs font-medium outline-none focus-visible:outline-2 focus-visible:outline-ring",
                seconds === d.seconds
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {d.label}
            </button>
          ))}
        </div>
        <Button
          type="submit"
          variant="primary"
          disabled={start.isPending || !question.trim() || filled < 2}
        >
          <BarChart3 className="h-3.5 w-3.5" aria-hidden="true" /> Start poll
        </Button>
      </div>
    </form>
  );
}
