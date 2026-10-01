import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { UserX } from "lucide-react";
import { toast } from "sonner";
import {
  approveJoinRequest,
  denyJoinRequest,
  kickMember,
  listJoinRequests,
  updateMemberRole,
} from "@adda/api-client";
import type { Community } from "@adda/types";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Panel, PanelHeader } from "@/ui/panel";
import { useChannelMembers } from "@/lib/data";

const ASSIGNABLE = ["moderator", "streamer", "member", "guest"] as const;

/** Members & roles for one channel — manageable by channel owner/admin. */
export function CreatorMembers({ channel }: { channel: Community }) {
  const canManage = channel.my_role === "owner" || channel.my_role === "admin";

  const { data: members = [] } = useChannelMembers(channel.id);
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["members", channel.id] });
    qc.invalidateQueries({ queryKey: ["join-requests", channel.id] });
    qc.invalidateQueries({ queryKey: ["channels", "mine"] });
  };

  const { data: requests = [] } = useQuery({
    queryKey: ["join-requests", channel.id],
    queryFn: () => listJoinRequests(channel.id),
    enabled: canManage && channel.is_private,
  });

  const changeRole = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      updateMemberRole(channel.id, userId, role),
    onSuccess: () => {
      toast.success("Role updated");
      invalidate();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Update failed"),
  });
  const kick = useMutation({
    mutationFn: (userId: string) => kickMember(channel.id, userId),
    onSuccess: () => {
      toast.success("Member removed");
      invalidate();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not remove"),
  });
  const approve = useMutation({
    mutationFn: (id: string) => approveJoinRequest(channel.id, id),
    onSuccess: () => {
      toast.success("Approved");
      invalidate();
    },
  });
  const deny = useMutation({
    mutationFn: (id: string) => denyJoinRequest(channel.id, id),
    onSuccess: () => {
      toast.success("Denied");
      invalidate();
    },
  });

  const [filter, setFilter] = useState("");
  const rows = members.filter(
    (m) =>
      !filter ||
      m.display_name.toLowerCase().includes(filter.toLowerCase()) ||
      m.username.toLowerCase().includes(filter.toLowerCase()),
  );

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-sm font-semibold">Members — {channel.name}</h1>
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter…"
          className="h-6 w-48 rounded-xs border border-line bg-panel px-2 text-2xs"
        />
      </div>

      {canManage && channel.is_private && requests.length > 0 && (
        <Panel>
          <PanelHeader title={`Join requests (${requests.length})`} />
          <div className="divide-y divide-line/50">
            {requests.map((r) => (
              <div key={r.id} className="flex items-center justify-between px-3 py-1.5">
                <span className="text-xs">
                  {r.display_name} <span className="text-2xs text-muted">@{r.username}</span>
                </span>
                <div className="flex gap-1">
                  <Button
                    variant="primary"
                    size="xs"
                    disabled={approve.isPending}
                    onClick={() => approve.mutate(r.id)}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="ghost"
                    size="xs"
                    disabled={deny.isPending}
                    onClick={() => deny.mutate(r.id)}
                  >
                    Deny
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      <Panel>
        <PanelHeader title={`${members.length} members`} />
        <div className="divide-y divide-line/50">
          {rows.map((m) => (
            <div key={m.user_id} className="flex items-center justify-between px-3 py-1.5">
              <div className="min-w-0">
                <p className="truncate text-xs">
                  {m.display_name} <span className="text-2xs text-muted">@{m.username}</span>
                </p>
                <p className="text-2xs text-muted">
                  joined {new Date(m.joined_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {m.role === "owner" ? (
                  <Badge tone="accent">owner</Badge>
                ) : canManage ? (
                  <>
                    <select
                      value={
                        ASSIGNABLE.includes(m.role as (typeof ASSIGNABLE)[number])
                          ? m.role
                          : "member"
                      }
                      onChange={(e) =>
                        changeRole.mutate({ userId: m.user_id, role: e.target.value })
                      }
                      className="h-6 rounded-xs border border-line bg-panel2 px-1 text-2xs"
                    >
                      {ASSIGNABLE.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                    <Button
                      variant="ghost"
                      size="xs"
                      title="Remove member"
                      disabled={kick.isPending}
                      onClick={() => kick.mutate(m.user_id)}
                    >
                      <UserX className="h-3 w-3" />
                    </Button>
                  </>
                ) : (
                  <Badge>{m.role}</Badge>
                )}
              </div>
            </div>
          ))}
          {rows.length === 0 && (
            <p className="py-6 text-center text-2xs text-muted">No members match.</p>
          )}
        </div>
      </Panel>
    </div>
  );
}
