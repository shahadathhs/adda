import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FiShield, FiUser, FiVideo, FiUserCheck, FiEye } from "react-icons/fi";
import { toast } from "sonner";
import { UserAvatar } from "@/shared/ui/user-avatar";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import * as api from "./api";
import type { MemberOut } from "./types";

const ROLES = ["owner", "admin", "moderator", "streamer", "member", "guest"] as const;

const ROLE_STYLES: Record<string, string> = {
  owner: "bg-purple-500/20 text-purple-300",
  admin: "bg-red-500/20 text-red-300",
  moderator: "bg-blue-500/20 text-blue-300",
  streamer: "bg-green-500/20 text-green-300",
  member: "bg-muted text-muted-foreground",
  guest: "bg-muted/50 text-muted-foreground/70",
};

const ROLE_ICONS: Record<string, React.ReactNode> = {
  owner: <FiShield className="h-3 w-3" />,
  admin: <FiShield className="h-3 w-3" />,
  moderator: <FiUserCheck className="h-3 w-3" />,
  streamer: <FiVideo className="h-3 w-3" />,
  member: <FiUser className="h-3 w-3" />,
  guest: <FiEye className="h-3 w-3" />,
};

export default function MembersPanel({
  communityId,
  canManage,
}: {
  communityId: string;
  canManage: boolean;
}) {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const { data: members } = useQuery({
    queryKey: ["members", communityId],
    queryFn: () => api.listMembers(communityId),
  });

  const { data: requests } = useQuery({
    queryKey: ["join-requests", communityId],
    queryFn: () => api.listJoinRequests(communityId),
    enabled: canManage,
  });

  const roleMut = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      api.updateMemberRole(communityId, userId, role),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["members", communityId] });
      toast.success("Role updated");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const kickMut = useMutation({
    mutationFn: (userId: string) => api.kickMember(communityId, userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["members", communityId] });
      toast.success("Member removed");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const approveMut = useMutation({
    mutationFn: (requestId: string) => api.approveJoinRequest(communityId, requestId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["join-requests", communityId] });
      qc.invalidateQueries({ queryKey: ["members", communityId] });
      toast.success("Request approved");
    },
  });

  const denyMut = useMutation({
    mutationFn: (requestId: string) => api.denyJoinRequest(communityId, requestId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["join-requests", communityId] });
      toast.success("Request denied");
    },
  });

  // Filtered members.
  const filtered = (members ?? []).filter((m) => {
    const matchesSearch =
      !search ||
      m.username.toLowerCase().includes(search.toLowerCase()) ||
      m.display_name.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "all" || m.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Role breakdown for stats.
  const counts = (members ?? []).reduce(
    (acc, m) => {
      acc[m.role] = (acc[m.role] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="flex flex-wrap gap-3 text-sm">
        <Card className="px-4 py-2">
          <span className="font-bold">{members?.length ?? 0}</span>{" "}
          <span className="text-muted-foreground">total</span>
        </Card>
        {ROLES.filter((r) => counts[r]).map((r) => (
          <Card key={r} className="px-4 py-2">
            <span className="font-bold">{counts[r]}</span>{" "}
            <span className="text-muted-foreground">{r}s</span>
          </Card>
        ))}
      </div>

      {/* Join requests (admin+) */}
      {canManage && requests && requests.length > 0 && (
        <Card className="p-4">
          <h3 className="mb-3 text-sm font-semibold">Pending Join Requests ({requests.length})</h3>
          <div className="space-y-2">
            {requests.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between rounded-lg border border-border p-2"
              >
                <div className="flex items-center gap-2">
                  <UserAvatar name={r.display_name} className="h-8 w-8 text-xs" />
                  <div>
                    <p className="text-sm font-medium">{r.display_name}</p>
                    <p className="text-xs text-muted-foreground">@{r.username}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" onClick={() => approveMut.mutate(r.id)}>
                    Approve
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => denyMut.mutate(r.id)}>
                    Deny
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Search + filter */}
      <div className="flex gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search members…"
          className="flex-1 rounded-lg border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
        >
          <option value="all">All roles</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      {/* Member cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((m) => (
          <MemberCard
            key={m.user_id}
            member={m}
            canManage={canManage}
            onRoleChange={(role) => roleMut.mutate({ userId: m.user_id, role })}
            onKick={() => {
              if (confirm(`Remove ${m.display_name} from this community?`))
                kickMut.mutate(m.user_id);
            }}
          />
        ))}
        {filtered.length === 0 && (
          <p className="col-span-full py-8 text-center text-sm text-muted-foreground">
            No members found.
          </p>
        )}
      </div>
    </div>
  );
}

function MemberCard({
  member,
  canManage,
  onRoleChange,
  onKick,
}: {
  member: MemberOut;
  canManage: boolean;
  onRoleChange: (role: string) => void;
  onKick: () => void;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <UserAvatar
          name={member.display_name}
          src={member.avatar_url}
          className="h-10 w-10 text-sm"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate font-medium">{member.display_name}</span>
            <span
              className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                ROLE_STYLES[member.role] ?? ROLE_STYLES.member
              }`}
            >
              {ROLE_ICONS[member.role]}
              {member.role}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">@{member.username}</p>
          {member.bio && (
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{member.bio}</p>
          )}
          <p className="mt-1 text-xs text-muted-foreground/70">
            Joined {new Date(member.joined_at).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Admin controls */}
      {canManage && member.role !== "owner" && (
        <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
          <select
            value={member.role}
            onChange={(e) => onRoleChange(e.target.value)}
            className="flex-1 rounded border border-input bg-transparent px-2 py-1 text-xs"
          >
            {ROLES.filter((r) => r !== "owner").map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <Button size="sm" variant="ghost" onClick={onKick}>
            Kick
          </Button>
        </div>
      )}
    </Card>
  );
}
