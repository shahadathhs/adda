import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteMessage, listChannels, listMessages } from "@adda/api-client";
import { Button } from "@/ui/button";
import { Panel, PanelHeader } from "@/ui/panel";
import { useAdminCommunities, useChannelMembers } from "@/lib/data";

/**
 * Chat moderation: inspect persisted channel messages and remove
 * rule-breaking ones. In creator mode the community is fixed (channel
 * context); in platform mode it's picked from all communities.
 */
export function ChatView({ communityId }: { communityId?: string }) {
  // Fixed (creator) mode pins the community; platform mode picks manually.
  const [manualPick, setManualPick] = useState("");
  const picked = communityId ?? manualPick;
  const [channelId, setChannelId] = useState("");

  const { data: allCommunities = [] } = useAdminCommunities();
  const { data: channels = [] } = useQuery({
    queryKey: ["channels", "list", picked],
    queryFn: () => listChannels(picked),
    enabled: !!picked,
  });
  // Guard against a stale selection when the community changes.
  const activeChannelId = channels.some((c) => c.id === channelId) ? channelId : "";
  const { data: members = [] } = useChannelMembers(picked || undefined);
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["messages", picked, activeChannelId],
    queryFn: () => listMessages(picked, activeChannelId),
    enabled: !!picked && !!activeChannelId,
    refetchInterval: 10_000,
  });

  const qc = useQueryClient();
  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ["messages", picked, activeChannelId] });
  const remove = useMutation({
    mutationFn: (messageId: string) => deleteMessage(picked, activeChannelId, messageId),
    onSuccess: () => {
      toast.success("Message deleted");
      invalidate();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not delete"),
  });

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-sm font-semibold">Chat moderation</h1>
        <div className="flex gap-2">
          {!communityId && (
            <select
              value={manualPick}
              onChange={(e) => {
                setManualPick(e.target.value);
                setChannelId("");
              }}
              className="h-7 rounded-sm border border-line bg-panel px-2 text-xs"
            >
              <option value="">Select community…</option>
              {allCommunities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
          <select
            value={activeChannelId}
            onChange={(e) => setChannelId(e.target.value)}
            disabled={!picked}
            className="h-7 rounded-sm border border-line bg-panel px-2 text-xs disabled:opacity-40"
          >
            <option value="">Select channel…</option>
            {channels.map((c) => (
              <option key={c.id} value={c.id}>
                # {c.slug}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Panel>
        <PanelHeader title={activeChannelId ? "Messages (refreshes 10s)" : "Messages"} />
        {!channelId ? (
          <p className="py-10 text-center text-xs text-muted">
            Pick a channel to inspect its persisted messages.
          </p>
        ) : isLoading ? (
          <p className="py-10 text-center text-xs text-muted">Loading…</p>
        ) : messages.length === 0 ? (
          <p className="py-10 text-center text-xs text-muted">No messages in this channel.</p>
        ) : (
          <div className="max-h-[60vh] divide-y divide-line/50 overflow-y-auto">
            {messages.map((m) => {
              const author = members.find((x) => x.user_id === m.user_id);
              return (
                <div key={m.id} className="group flex items-start gap-3 px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs">
                      <span className="font-medium">{m.display_name}</span>{" "}
                      {author && (
                        <span className="mr-1 rounded-xs border border-line px-1 text-2xs text-muted">
                          {author.role}
                        </span>
                      )}
                      <span className="text-2xs text-muted">
                        @{m.username} · {new Date(m.created_at).toLocaleString()}
                      </span>
                    </p>
                    <p className="break-words text-xs text-fg/90">{m.content}</p>
                  </div>
                  <Button
                    variant="danger"
                    size="xs"
                    className="opacity-0 transition-opacity group-hover:opacity-100"
                    disabled={remove.isPending}
                    onClick={() => remove.mutate(m.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </Panel>
    </div>
  );
}
