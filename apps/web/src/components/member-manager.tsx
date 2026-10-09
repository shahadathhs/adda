"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { UserMinus } from "lucide-react";
import { toast } from "sonner";
import { kickMember, listMembers, updateMemberRole } from "@adda/api-client";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/primitives";

const ROLES = ["moderator", "streamer", "member"];

export function MemberManager({ communityId }: { communityId: string }) {
  const qc = useQueryClient();
  const { data: members = [] } = useQuery({
    queryKey: ["members", communityId],
    queryFn: () => listMembers(communityId),
  });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["members", communityId] });

  const roleMut = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      updateMemberRole(communityId, userId, role),
    onSuccess: () => {
      toast.success("Role updated");
      invalidate();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not update role"),
  });
  const kickMut = useMutation({
    mutationFn: (userId: string) => kickMember(communityId, userId),
    onSuccess: () => {
      toast.success("Member removed");
      invalidate();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not remove member"),
  });

  return (
    <div className="divide-y divide-border">
      {members.map((m) => (
        <div key={m.user_id} className="flex items-center gap-3 py-2.5">
          <UserAvatar name={m.display_name} src={m.avatar_url} className="h-8 w-8 text-xs" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{m.display_name}</p>
            <p className="text-xs text-muted-foreground">@{m.username}</p>
          </div>
          <label className="sr-only" htmlFor={`role-${m.user_id}`}>
            Role for {m.display_name}
          </label>
          <select
            id={`role-${m.user_id}`}
            value={m.role}
            disabled={roleMut.isPending}
            onChange={(e) => roleMut.mutate({ userId: m.user_id, role: e.target.value })}
            className="h-7 rounded-xs border border-input bg-input/50 px-1.5 text-xs text-foreground"
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <Button
            variant="ghost"
            size="sm"
            title={`Remove ${m.display_name}`}
            disabled={kickMut.isPending}
            onClick={() => kickMut.mutate(m.user_id)}
          >
            <UserMinus className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">Remove</span>
          </Button>
        </div>
      ))}
      {members.length === 0 && (
        <p className="py-4 text-center text-xs text-muted-foreground">No members yet.</p>
      )}
    </div>
  );
}

/** Expandable wrapper so the studio stays one screen per channel. */
export function MembersPanel({ communityId }: { communityId: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <Button variant="ghost" size="sm" onClick={() => setOpen((v) => !v)}>
        {open ? "Hide members" : "Members"}
      </Button>
      {open && (
        <div className="mt-2 rounded-md border border-border p-3">
          <MemberManager communityId={communityId} />
        </div>
      )}
    </div>
  );
}
