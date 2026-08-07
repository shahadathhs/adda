import toast from "react-hot-toast";
import { UserAvatar } from "@/shared/ui/user-avatar";
import { Button } from "@/shared/ui/button";
import CopyField from "@/shared/ui/CopyField";
import {
  useAdminCommunityMembers,
  useAdminCommunityStreamKey,
  useAdminKickMember,
  useAdminRotateCommunityKey,
} from "@/features/admin/hooks";
import type { AdminCommunity, AdminMember } from "@/features/admin/types";

export function CommunityManager({ community }: { community: AdminCommunity }) {
  const { data: members = [] } = useAdminCommunityMembers(community.id);
  const { data: creds } = useAdminCommunityStreamKey(community.id);
  const kickMutation = useAdminKickMember(community.id);
  const rotateMutation = useAdminRotateCommunityKey(community.id);

  const kick = (m: AdminMember) => {
    if (!window.confirm(`Remove ${m.username} from this community?`)) return;
    kickMutation.mutate(m.user_id, {
      onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
    });
  };

  const rotate = () => {
    if (!window.confirm("Rotate the stream key? The current OBS connection will be kicked."))
      return;
    rotateMutation.mutate(undefined, {
      onSuccess: () => toast.success("Key rotated"),
      onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
    });
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div>
        <h4 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Members</h4>
        <div className="space-y-1">
          {members.map((m) => (
            <div
              key={m.user_id}
              className="flex items-center justify-between rounded bg-background/50 px-2 py-1 text-sm"
            >
              <div className="flex items-center gap-2">
                <UserAvatar name={m.display_name} className="h-6 w-6 text-xs" />
                <span>{m.display_name}</span>
                <span className="text-xs text-muted-foreground">{m.role}</span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                disabled={m.role === "owner"}
                onClick={() => kick(m)}
              >
                Remove
              </Button>
            </div>
          ))}
          {members.length === 0 && <p className="text-xs text-muted-foreground">No members.</p>}
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold uppercase text-muted-foreground">Stream key</h4>
          <Button size="sm" variant="outline" onClick={rotate}>
            Rotate
          </Button>
        </div>
        {creds && (
          <div className="space-y-2">
            <CopyField label="Stream URL" value={creds.stream_url} />
            <CopyField label="Stream Key" value={creds.stream_key} />
          </div>
        )}
      </div>
    </div>
  );
}
