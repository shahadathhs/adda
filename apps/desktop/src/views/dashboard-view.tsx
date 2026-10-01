import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Eye, Radio, Square, Users, Boxes } from "lucide-react";
import { toast } from "sonner";
import { adminStopStream } from "@adda/api-client";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { EmptyRow, Table, Td, Th, Tr } from "@/ui/table";
import { Panel, PanelHeader } from "@/ui/panel";
import { consoleKeys, useAdminLive, useAdminStats } from "@/lib/data";
import type { ViewId } from "./console-layout";

function StatTile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: number | undefined;
}) {
  return (
    <div className="flex items-center gap-3 rounded-sm border border-line bg-panel px-3 py-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-panel2">
        <Icon className="h-4 w-4 text-accent" />
      </div>
      <div>
        <p className="font-num text-lg font-semibold leading-none">{value ?? "—"}</p>
        <p className="mt-0.5 text-2xs uppercase tracking-wider text-muted">{label}</p>
      </div>
    </div>
  );
}

export function DashboardView({ onNavigate }: { onNavigate: (v: ViewId) => void }) {
  const { data: stats } = useAdminStats();
  const { data: live = [] } = useAdminLive();
  const qc = useQueryClient();
  const stop = useMutation({
    mutationFn: adminStopStream,
    onSuccess: () => {
      toast.success("Stream stopped");
      qc.invalidateQueries({ queryKey: consoleKeys.live });
    },
    onError: () => toast.error("Could not stop the stream"),
  });

  return (
    <div className="space-y-4 p-4">
      <div>
        <h1 className="text-sm font-semibold">Dashboard</h1>
        <p className="text-2xs text-muted">
          Press <kbd className="rounded-xs border border-line px-1 font-num">⌘K</kbd> for the
          command palette, <kbd className="rounded-xs border border-line px-1 font-num">⌘1–⌘7</kbd>{" "}
          to switch views.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <StatTile icon={Users} label="Users" value={stats?.users} />
        <StatTile icon={Boxes} label="Communities" value={stats?.communities} />
        <StatTile icon={Radio} label="Live now" value={stats?.live} />
      </div>

      <Panel>
        <PanelHeader
          title="Active streams"
          right={
            <Button variant="ghost" size="xs" onClick={() => onNavigate("streams")}>
              All streams →
            </Button>
          }
        />
        <Table>
          <thead>
            <tr>
              <Th>Channel</Th>
              <Th className="w-24 text-right">Viewers</Th>
              <Th className="w-20" />
            </tr>
          </thead>
          <tbody>
            {live.length === 0 && <EmptyRow colSpan={3} label="No active streams." />}
            {live.map((s) => (
              <Tr key={s.community_id}>
                <Td>
                  <div className="flex items-center gap-2">
                    <Badge tone="live">
                      <span className="h-1 w-1 animate-pulse rounded-full bg-live" /> LIVE
                    </Badge>
                    {s.name}
                  </div>
                </Td>
                <Td className="text-right font-num">
                  <Eye className="mr-1 inline h-3 w-3 text-muted" />
                  {s.viewers}
                </Td>
                <Td className="text-right">
                  <Button
                    variant="danger"
                    size="xs"
                    disabled={stop.isPending}
                    onClick={() => stop.mutate(s.community_id)}
                  >
                    <Square className="h-3 w-3" /> Stop
                  </Button>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </Panel>
    </div>
  );
}
