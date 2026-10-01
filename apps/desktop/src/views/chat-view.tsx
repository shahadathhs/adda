import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteMessage, listChannels, listMessages } from "@adda/api-client";
import { Button } from "@/ui/button";
import { Panel, PanelHeader } from "@/ui/panel";
import { useAdminCommunities } from "@/lib/data";

/**
 * Chat moderation: pick a community → channel, inspect persisted messages,
 * remove rule-breaking ones. Live community chat is ephemeral (not stored);
 * only DB-backed channel messages are moderated here.
 */
export function ChatView() {
  const [communityId, setCommunityId] = useState("");
  const [channelId, setChannelId] = useState("");

  const { data: communities = [] } = useAdminCommunities();
  const { data: channels = [] } = useQuery({
    queryKey: ["console", "channels", communityId],
    queryFn: () => listChannels(communityId),
    enabled: !!communityId,
  });
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["console", "messages", communityId, channelId],
    queryFn: () => listMessages(communityId, channelId),
    enabled: !!communityId && !!channelId,
    refetchInterval: 10_000,
  });

  const qc = useQueryClient();
  const remove = useMutation({
    mutationFn: (messageId: string) => deleteMessage(communityId, channelId, messageId),
    onSuccess: () => {
      toast.success("Message deleted");
      qc.invalidateQueries({ queryKey: ["console", "messages", communityId, channelId] });
    },
    onError: () => toast.error("Could not delete message"),
  });

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-sm font-semibold">Chat moderation</h1>
        <div className="flex gap-2">
          <select
            value={communityId}
            onChange={(e) => {
              setCommunityId(e.target.value);
              setChannelId("");
            }}
            className="h-7 rounded-sm border border-line bg-panel px-2 text-xs"
          >
            <option value="">Select community…</option>
            {communities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            value={channelId}
            onChange={(e) => setChannelId(e.target.value)}
            disabled={!communityId}
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
        <PanelHeader title={channelId ? "Messages (refreshes 10s)" : "Messages"} />
        {!channelId ? (
          <p className="py-10 text-center text-xs text-muted">
            Pick a community and channel to inspect its persisted messages.
          </p>
        ) : isLoading ? (
          <p className="py-10 text-center text-xs text-muted">Loading…</p>
        ) : messages.length === 0 ? (
          <p className="py-10 text-center text-xs text-muted">No messages in this channel.</p>
        ) : (
          <div className="max-h-[60vh] divide-y divide-line/50 overflow-y-auto">
            {messages.map((m) => (
              <div key={m.id} className="group flex items-start gap-3 px-3 py-2">
                <div className="min-w-0 flex-1">
                  <p className="text-xs">
                    <span className="font-medium">{m.display_name}</span>{" "}
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
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
