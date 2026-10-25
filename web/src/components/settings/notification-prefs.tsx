"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { notificationPrefs, setNotificationPref } from "@/lib/api";
import type { NotificationPref } from "@/lib/types";
import { cn } from "@/lib/cn";

function Switch({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-5 w-9 shrink-0 rounded-full transition-colors duration-120 focus-visible:outline-2 focus-visible:outline-ring",
        checked ? "bg-primary" : "bg-secondary",
        disabled && "opacity-50",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-foreground transition-transform duration-120",
          checked && "translate-x-4 bg-primary-foreground",
        )}
      />
    </button>
  );
}

/** In-app alerts for everything, plus per-channel bell and email switches for live alerts. */
export function NotificationPrefsForm() {
  const qc = useQueryClient();
  const { data, isPending } = useQuery({
    queryKey: ["notification-prefs"],
    queryFn: notificationPrefs,
  });
  const save = useMutation({
    mutationFn: setNotificationPref,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notification-prefs"] }),
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not save"),
  });

  if (isPending || !data) return <p className="text-sm text-muted-foreground">Loading…</p>;
  const set = (p: NotificationPref, patch: { bell?: boolean; email?: boolean }) =>
    save.mutate({ community_id: p.community_id, ...patch });

  return (
    <div className="space-y-8">
      <section aria-labelledby="inapp">
        <h2
          id="inapp"
          className="mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground"
        >
          In the app (bell)
        </h2>
        <div className="divide-y divide-border rounded-md border border-border bg-card">
          <div className="flex items-center justify-between gap-4 p-4">
            <div>
              <p className="text-sm font-semibold text-foreground">
                A channel you follow goes live
              </p>
              <p className="text-[13px] text-muted-foreground">
                Applies to every channel unless you change it below.
              </p>
            </div>
            <Switch
              label="Bell for live channels"
              checked={data.default.bell}
              onChange={(bell) => set(data.default, { bell })}
              disabled={save.isPending}
            />
          </div>
          <div className="p-4 text-[13px] text-muted-foreground">
            Mentions of your name and replies to your messages always reach your bell.
          </div>
        </div>
      </section>

      {data.email_available && (
        <section aria-labelledby="email">
          <h2
            id="email"
            className="mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground"
          >
            Email
          </h2>
          <div className="rounded-md border border-border bg-card">
            <div className="flex items-center justify-between gap-4 border-b border-border p-4">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Email me when a channel goes live
                </p>
                <p className="text-[13px] text-muted-foreground">
                  At most one email per channel per hour. Off unless you turn it on.
                </p>
              </div>
              <Switch
                label="Email for live channels"
                checked={data.default.email}
                onChange={(email) => set(data.default, { email })}
                disabled={save.isPending}
              />
            </div>
            <ChannelTable
              channels={data.channels}
              emailAvailable
              onChange={set}
              busy={save.isPending}
            />
          </div>
        </section>
      )}
      {!data.email_available && (
        <p className="rounded-md border border-border bg-card p-4 text-[13px] text-muted-foreground">
          This server has no email set up, so live emails are not available.
        </p>
      )}

      {!data.email_available && data.channels.length > 0 && (
        <section aria-labelledby="chan">
          <h2
            id="chan"
            className="mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground"
          >
            Channels you follow
          </h2>
          <div className="rounded-md border border-border bg-card">
            <ChannelTable
              channels={data.channels}
              emailAvailable={false}
              onChange={set}
              busy={save.isPending}
            />
          </div>
        </section>
      )}
    </div>
  );
}

function ChannelTable({
  channels,
  emailAvailable,
  onChange,
  busy,
}: {
  channels: NotificationPref[];
  emailAvailable: boolean;
  onChange: (p: NotificationPref, patch: { bell?: boolean; email?: boolean }) => void;
  busy: boolean;
}) {
  if (channels.length === 0)
    return (
      <p className="p-4 text-[13px] text-muted-foreground">You do not follow any channels yet.</p>
    );
  return (
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="border-b border-border text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
          <th className="px-4 py-2 font-semibold">Channel</th>
          <th className="py-2 text-center font-semibold">Bell</th>
          {emailAvailable && <th className="py-2 pr-4 text-center font-semibold">Email</th>}
        </tr>
      </thead>
      <tbody>
        {channels.map((c) => (
          <tr key={c.community_id} className="border-b border-border last:border-b-0">
            <td className="px-4 py-2.5 text-foreground">{c.community_name}</td>
            <td className="py-2.5">
              <div className="flex justify-center">
                <Switch
                  label={`Bell for ${c.community_name}`}
                  checked={c.bell}
                  onChange={(bell) => onChange(c, { bell })}
                  disabled={busy}
                />
              </div>
            </td>
            {emailAvailable && (
              <td className="py-2.5 pr-4">
                <div className="flex justify-center">
                  <Switch
                    label={`Email for ${c.community_name}`}
                    checked={c.email}
                    onChange={(email) => onChange(c, { email })}
                    disabled={busy}
                  />
                </div>
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
