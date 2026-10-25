"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { listBans, liftBan } from "@/lib/api";
import { mmss, useCountdown } from "@/lib/use-countdown";
import { Button } from "@/components/ui/button";
import type { Ban } from "@/lib/types";

function Remaining({ ban }: { ban: Ban }) {
  const left = useCountdown(ban.expires_at);
  if (!ban.expires_at) return <>Permanent</>;
  return <>{left === null ? "--:--" : mmss(left)}</>;
}

/** Active timeouts and bans, with Lift. */
export function BansPanel({ communityId }: { communityId: string }) {
  const qc = useQueryClient();
  const { data: bans, isPending } = useQuery({
    queryKey: ["bans", communityId],
    queryFn: () => listBans(communityId),
    refetchInterval: 15_000,
  });
  const lift = useMutation({
    mutationFn: (id: string) => liftBan(communityId, id),
    onSuccess: () => {
      toast.success("Restriction lifted");
      void qc.invalidateQueries({ queryKey: ["bans", communityId] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not lift"),
  });

  return (
    <section className="rounded-md border border-border bg-card p-5">
      <h2 className="font-display text-base font-semibold text-foreground">
        Timeouts and bans
        {bans && (
          <span className="ml-2 font-num text-sm font-medium text-muted-foreground">
            {bans.length}
          </span>
        )}
      </h2>
      {isPending ? (
        <p className="mt-3 text-sm text-muted-foreground" role="status">
          Loading…
        </p>
      ) : !bans?.length ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Nobody is timed out or banned. In chat, hover a message and choose ⋯ to time someone out.
        </p>
      ) : (
        <table className="mt-3 w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
              <th className="py-2 font-semibold">Viewer</th>
              <th className="py-2 font-semibold">Reason</th>
              <th className="py-2 font-semibold">Remaining</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody>
            {bans.map((b) => (
              <tr key={b.id} className="border-b border-border last:border-b-0">
                <td className="py-2.5 font-medium text-foreground">{b.username}</td>
                <td className="py-2.5 text-[13px] text-muted-foreground">{b.reason ?? "—"}</td>
                <td className="py-2.5 font-num text-[13px] text-foreground">
                  <Remaining ban={b} />
                </td>
                <td className="py-2.5 text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={lift.isPending}
                    onClick={() => lift.mutate(b.id)}
                  >
                    Lift<span className="sr-only"> for {b.username}</span>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
