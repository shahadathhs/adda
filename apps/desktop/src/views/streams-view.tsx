import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Eye, Square } from "lucide-react";
import { toast } from "sonner";
import { adminStopStream } from "@adda/api-client";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { EmptyRow, Table, Td, Th, Tr } from "@/ui/table";
import { Panel, PanelHeader } from "@/ui/panel";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/ui/context-menu";
import { consoleKeys, useAdminLive } from "@/lib/data";

export function StreamsView() {
  const { data: live = [], isLoading } = useAdminLive();
  const qc = useQueryClient();
  const stop = useMutation({
    mutationFn: adminStopStream,
    onSuccess: () => {
      toast.success("Publisher disconnected");
      qc.invalidateQueries({ queryKey: consoleKeys.live });
    },
    onError: () => toast.error("Could not stop the stream"),
  });

  const totalViewers = live.reduce((n, s) => n + s.viewers, 0);

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-baseline justify-between">
        <h1 className="text-sm font-semibold">Streams</h1>
        <span className="text-2xs text-muted">
          {live.length} live · {totalViewers} viewers · refreshes every 5s
        </span>
      </div>

      <Panel>
        <PanelHeader title="Live monitor" />
        <Table>
          <thead>
            <tr>
              <Th>Channel</Th>
              <Th className="w-28">Community ID</Th>
              <Th className="w-24 text-right">Viewers</Th>
              <Th className="w-24 text-right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <Td colSpan={4} className="py-8 text-center text-muted">
                  Loading…
                </Td>
              </tr>
            )}
            {!isLoading && live.length === 0 && (
              <EmptyRow colSpan={4} label="Nobody is streaming right now." />
            )}
            {live.map((s) => (
              <ContextMenu key={s.community_id}>
                <ContextMenuTrigger asChild>
                  <Tr className="cursor-default">
                    <Td>
                      <div className="flex items-center gap-2">
                        <Badge tone="live">
                          <span className="h-1 w-1 animate-pulse rounded-full bg-live" /> LIVE
                        </Badge>
                        {s.name}
                      </div>
                    </Td>
                    <Td className="font-num text-muted">{s.community_id}</Td>
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
                        <Square className="h-3 w-3" /> Force stop
                      </Button>
                    </Td>
                  </Tr>
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuItem danger onSelect={() => stop.mutate(s.community_id)}>
                    <Square className="h-3 w-3" /> Force stop
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            ))}
          </tbody>
        </Table>
      </Panel>
    </div>
  );
}
