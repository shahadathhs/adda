import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { KeyRound, ShieldOff, Trash2, UserX } from "lucide-react";
import { toast } from "sonner";
import {
  adminCommunityMembers,
  adminCommunityStreamKey,
  adminDeleteCommunity,
  adminKickMember,
  adminRotateCommunityKey,
  adminStopStream,
  adminUpdateCommunity,
} from "@adda/api-client";
import type { StreamCredentials } from "@adda/types";
import { apiBaseUrl } from "@adda/shared";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/ui/dialog";
import { Panel, PanelHeader } from "@/ui/panel";
import { EmptyRow, Table, Td, Th, Tr } from "@/ui/table";
import { cn } from "@/ui/cn";
import { consoleKeys, useAdminCommunities } from "@/lib/data";

function StreamKeyPanel({ communityId }: { communityId: string }) {
  const qc = useQueryClient();
  const { data: creds } = useQuery({
    queryKey: consoleKeys.streamKey(communityId),
    queryFn: () => adminCommunityStreamKey(communityId),
  });
  const rotate = useMutation({
    mutationFn: () => adminRotateCommunityKey(communityId),
    onSuccess: (c: StreamCredentials) => {
      qc.setQueryData(consoleKeys.streamKey(communityId), c);
      toast.success("Key rotated — the active publisher was kicked.");
    },
    onError: () => toast.error("Could not rotate the key"),
  });
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-2xs font-semibold uppercase tracking-wider text-muted">
          Stream key
        </span>
        <Button
          variant="ghost"
          size="xs"
          disabled={rotate.isPending}
          onClick={() => rotate.mutate()}
        >
          <KeyRound className="h-3 w-3" /> Rotate
        </Button>
      </div>
      {creds && (
        <p className="break-all rounded-xs border border-line bg-bg px-2 py-1 font-num text-2xs text-muted">
          {creds.stream_key}
        </p>
      )}
    </div>
  );
}

function MembersPanel({ communityId }: { communityId: string }) {
  const qc = useQueryClient();
  const { data: members = [] } = useQuery({
    queryKey: consoleKeys.members(communityId),
    queryFn: () => adminCommunityMembers(communityId),
  });
  const kick = useMutation({
    mutationFn: (userId: string) => adminKickMember(communityId, userId),
    onSuccess: () => {
      toast.success("Member removed");
      qc.invalidateQueries({ queryKey: consoleKeys.members(communityId) });
    },
    onError: () => toast.error("Could not remove member"),
  });
  return (
    <div className="space-y-1.5">
      <span className="text-2xs font-semibold uppercase tracking-wider text-muted">
        Members ({members.length})
      </span>
      <div className="max-h-44 overflow-y-auto rounded-xs border border-line">
        {members.map((m) => (
          <div
            key={m.user_id}
            className="flex items-center justify-between border-b border-line/50 px-2 py-1 last:border-0"
          >
            <div className="min-w-0">
              <p className="truncate text-xs">{m.display_name}</p>
              <p className="truncate text-2xs text-muted">
                @{m.username} · {m.role}
              </p>
            </div>
            {m.role !== "owner" && (
              <Button
                variant="ghost"
                size="xs"
                disabled={kick.isPending}
                onClick={() => kick.mutate(m.user_id)}
              >
                <UserX className="h-3 w-3" />
              </Button>
            )}
          </div>
        ))}
        {members.length === 0 && (
          <p className="px-2 py-3 text-center text-2xs text-muted">No members</p>
        )}
      </div>
    </div>
  );
}

export function CommunitiesView() {
  const { data: communities = [], isLoading } = useAdminCommunities();
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: consoleKeys.communities });

  const stop = useMutation({
    mutationFn: adminStopStream,
    onSuccess: () => {
      toast.success("Stream stopped");
      invalidate();
    },
  });
  const suspend = useMutation({
    mutationFn: ({ id, suspended }: { id: string; suspended: boolean }) =>
      adminUpdateCommunity(id, { is_suspended: suspended }),
    onSuccess: (_d, vars) => {
      toast.success(vars.suspended ? "Community suspended" : "Community reinstated");
      invalidate();
    },
  });
  const remove = useMutation({
    mutationFn: adminDeleteCommunity,
    onSuccess: () => {
      toast.success("Community deleted");
      invalidate();
    },
  });

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-sm font-semibold">Communities</h1>
      <Panel>
        <PanelHeader title={`All communities (${communities.length})`} />
        <Table>
          <thead>
            <tr>
              <Th>Name</Th>
              <Th className="w-20 text-right">Members</Th>
              <Th className="w-24">Status</Th>
              <Th className="w-64 text-right">Actions</Th>
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
            {!isLoading && communities.length === 0 && (
              <EmptyRow colSpan={4} label="No communities." />
            )}
            {communities.map((c) => (
              <Tr key={c.id}>
                <Td>
                  <p className="font-medium">{c.name}</p>
                  <p className="font-num text-2xs text-muted">@{c.slug}</p>
                </Td>
                <Td className="text-right font-num">{c.member_count}</Td>
                <Td>
                  <div className="flex gap-1">
                    {c.is_live && (
                      <Badge tone="live">
                        <span className="h-1 w-1 animate-pulse rounded-full bg-live" /> LIVE
                      </Badge>
                    )}
                    {c.is_suspended && <Badge tone="danger">Suspended</Badge>}
                    {!c.is_live && !c.is_suspended && <Badge>OK</Badge>}
                  </div>
                </Td>
                <Td className="text-right">
                  <div className="flex justify-end gap-1">
                    {c.is_live && (
                      <Button variant="danger" size="xs" onClick={() => stop.mutate(c.id)}>
                        Stop stream
                      </Button>
                    )}
                    <Button
                      variant={c.is_suspended ? "default" : "ghost"}
                      size="xs"
                      onClick={() => suspend.mutate({ id: c.id, suspended: !c.is_suspended })}
                    >
                      <ShieldOff className="h-3 w-3" />
                      {c.is_suspended ? "Reinstate" : "Suspend"}
                    </Button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="xs">
                          Manage
                        </Button>
                      </DialogTrigger>
                      <DialogContent title={`${c.name} — @${c.slug}`}>
                        <div className="space-y-4">
                          <StreamKeyPanel communityId={c.id} />
                          <MembersPanel communityId={c.id} />
                          <div className="flex justify-between border-t border-line pt-3">
                            <span className="text-2xs text-muted">Danger zone</span>
                            <Button
                              variant="danger"
                              size="xs"
                              onClick={() => {
                                remove.mutate(c.id);
                              }}
                            >
                              <Trash2 className="h-3 w-3" /> Delete community
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </Panel>
      <p className={cn("text-2xs text-muted")}>
        Playback origin: <span className="font-num">{apiBaseUrl()}</span> — keys are shown only to
        operators and rotate instantly (kicks active publishers).
      </p>
    </div>
  );
}
