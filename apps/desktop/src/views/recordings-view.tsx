import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Play, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { adminDeleteRecording, adminRecordings } from "@adda/api-client";
import { apiBaseUrl } from "@adda/shared";
import type { Community, Recording } from "@adda/types";
import { Button } from "@/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/ui/dialog";
import { EmptyRow, Table, Td, Th, Tr } from "@/ui/table";
import { Panel, PanelHeader } from "@/ui/panel";
import { useAdminCommunities, useChannelRecordings } from "@/lib/data";

function formatSize(bytes: number): string {
  if (bytes > 1e9) return `${(bytes / 1e9).toFixed(2)} GB`;
  if (bytes > 1e6) return `${(bytes / 1e6).toFixed(1)} MB`;
  return `${(bytes / 1e3).toFixed(0)} KB`;
}

function RecordingsTable({
  recordings,
  canDelete,
  onDelete,
}: {
  recordings: Recording[];
  canDelete: boolean;
  onDelete?: (path: string) => void;
}) {
  return (
    <Table>
      <thead>
        <tr>
          <Th>File</Th>
          <Th className="w-24 text-right">Size</Th>
          <Th className="w-40">Recorded</Th>
          <Th className="w-28 text-right">Actions</Th>
        </tr>
      </thead>
      <tbody>
        {recordings.length === 0 && <EmptyRow colSpan={4} label="No recordings yet." />}
        {recordings.map((r) => {
          const url = `${apiBaseUrl()}/api/recordings/file?path=${encodeURIComponent(r.path)}`;
          return (
            <Tr key={r.path}>
              <Td className="font-num">{r.name}</Td>
              <Td className="text-right font-num">{formatSize(r.size_bytes)}</Td>
              <Td className="font-num text-muted">{new Date(r.created_at).toLocaleString()}</Td>
              <Td className="text-right">
                <div className="flex justify-end gap-1">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="xs">
                        <Play className="h-3 w-3" /> Play
                      </Button>
                    </DialogTrigger>
                    <DialogContent title={r.name} className="max-w-3xl">
                      <video src={url} controls autoPlay className="w-full rounded-xs" />
                    </DialogContent>
                  </Dialog>
                  <a href={url} download target="_blank" rel="noreferrer">
                    <Button variant="ghost" size="xs">
                      <Download className="h-3 w-3" />
                    </Button>
                  </a>
                  {canDelete && onDelete && (
                    <Button variant="danger" size="xs" onClick={() => onDelete(r.path)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </Td>
            </Tr>
          );
        })}
      </tbody>
    </Table>
  );
}

/** Channel mode: one community's recordings (play/download). */
export function ChannelRecordingsView({ channel }: { channel: Community }) {
  const { data: recordings = [], isLoading } = useChannelRecordings(channel.id);
  return (
    <div className="space-y-4 p-4">
      <h1 className="text-sm font-semibold">Recordings — {channel.name}</h1>
      <Panel>
        <PanelHeader title={`${recordings.length} recordings`} />
        {isLoading ? (
          <p className="py-8 text-center text-xs text-muted">Loading…</p>
        ) : (
          <RecordingsTable recordings={recordings} canDelete={false} />
        )}
      </Panel>
    </div>
  );
}

/** Platform mode: all recordings across communities, with delete. */
export function RecordingsView() {
  const [communityId, setCommunityId] = useState("");
  const { data: communities = [] } = useAdminCommunities();
  const { data: recordings = [], isLoading } = useQuery({
    queryKey: ["console", "recordings", communityId || "all"],
    queryFn: () => adminRecordings(communityId || undefined),
  });
  const qc = useQueryClient();
  const remove = useMutation({
    mutationFn: adminDeleteRecording,
    onSuccess: () => {
      toast.success("Recording deleted");
      qc.invalidateQueries({ queryKey: ["console", "recordings"] });
    },
    onError: () => toast.error("Delete failed"),
  });

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-sm font-semibold">Recordings</h1>
        <select
          value={communityId}
          onChange={(e) => setCommunityId(e.target.value)}
          className="h-7 rounded-sm border border-line bg-panel px-2 text-xs"
        >
          <option value="">All communities</option>
          {communities.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <Panel>
        <PanelHeader title={`${recordings.length} recordings`} />
        {isLoading ? (
          <p className="py-8 text-center text-xs text-muted">Loading…</p>
        ) : (
          <RecordingsTable
            recordings={recordings}
            canDelete
            onDelete={(path) => remove.mutate(path)}
          />
        )}
      </Panel>
    </div>
  );
}
