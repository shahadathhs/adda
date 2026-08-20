import { useState } from "react";
import { FiHash, FiLock, FiPlus, FiRadio, FiTrash2, FiVideoOff, FiVolume1 } from "react-icons/fi";
import { toast } from "sonner";
import { hlsBaseUrl } from "@/shared/config";
import { useConfirm } from "@/shared/ui/use-confirm";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import ChatPanel from "@/features/realtime/ChatPanel";
import LivePlayer from "@/features/streaming/LivePlayer";
import { useStreamStatus } from "@/features/streaming/hooks";
import {
  useChannelMembers,
  useChannels,
  useCreateChannel,
  useDeleteChannel,
  useUpdateChannel,
} from "./hooks";
import type { Channel } from "./types";

/** Discord-style channel view — lives inside the Channels tab. */
export default function ChannelView({
  communityId,
  canManage,
}: {
  communityId: string;
  canManage: boolean;
}) {
  const { data: channels } = useChannels(communityId);
  const { data: status } = useStreamStatus(communityId, true);
  const createMut = useCreateChannel(communityId);
  const updateMut = useUpdateChannel(communityId);
  const deleteMut = useDeleteChannel(communityId);
  const { confirm, dialog } = useConfirm();

  const [activeId, setActiveId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const isLive = status?.is_live ?? false;
  // Auto-select first accessible non-live channel (derived during render).
  const active =
    channels?.find((c) => c.id === activeId) ??
    channels?.find((c) => c.type !== "live" && c.has_access) ??
    channels?.[0];
  const hlsUrl = `${hlsBaseUrl()}/community/${communityId}/index.m3u8`;

  const handleCreate = (data: {
    name: string;
    slug: string;
    type: string;
    is_restricted: boolean;
  }) => {
    createMut.mutate(data, {
      onSuccess: () => {
        toast.success("Channel created");
        setShowCreate(false);
      },
      onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
    });
  };

  const handleDelete = (ch: Channel) => {
    confirm({
      title: "Delete channel",
      description: `Delete #${ch.slug}? All messages will be lost.`,
      confirmText: "Delete",
      destructive: true,
      onConfirm: () =>
        deleteMut.mutate(ch.id, {
          onSuccess: () => {
            if (activeId === ch.id) setActiveId(null);
            toast.success("Channel deleted");
          },
          onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
        }),
    });
  };

  const renderCenter = () => {
    if (!active) {
      return (
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
          Select a channel
        </div>
      );
    }

    // Live channel → player.
    if (active.type === "live") {
      return (
        <div className="h-full overflow-y-auto p-4">
          {isLive ? (
            <LivePlayer hlsUrl={hlsUrl} />
          ) : (
            <Card className="flex aspect-video items-center justify-center">
              <div className="text-center">
                <FiVideoOff className="mx-auto mb-2 h-10 w-10 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">No live stream right now.</p>
              </div>
            </Card>
          )}
        </div>
      );
    }

    // Locked channel → access denied.
    if (!active.has_access) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
          <FiLock className="h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm font-medium">#{active.slug}</p>
          <p className="text-xs text-muted-foreground">
            You don't have access to this channel. Ask an admin to be added.
          </p>
        </div>
      );
    }

    // Text/announcement channel → chat.
    return <ChatPanel communityId={communityId} channelId={active.id} />;
  };

  return (
    <div className="flex h-[600px] overflow-hidden rounded-lg border border-border">
      {/* Channel sidebar */}
      <div className="flex w-52 shrink-0 flex-col border-r border-border bg-muted/30">
        <div className="flex-1 overflow-y-auto p-2">
          <div className="mb-1 px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Channels
          </div>
          {channels?.map((ch) => {
            const isActive = activeId === ch.id;
            const locked = !ch.has_access;
            return (
              <div key={ch.id} className="group relative">
                <button
                  onClick={() => {
                    setActiveId(ch.id);
                    setEditId(null);
                  }}
                  className={`mb-0.5 flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 pr-7 text-sm transition-colors ${
                    isActive
                      ? "bg-primary/10 font-medium text-primary"
                      : locked
                        ? "text-muted-foreground/50 hover:bg-muted"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {ch.type === "live" ? (
                    <FiRadio className="h-3.5 w-3.5 shrink-0" />
                  ) : ch.type === "announcement" ? (
                    <FiVolume1 className="h-3.5 w-3.5 shrink-0" />
                  ) : (
                    <FiHash className="h-3.5 w-3.5 shrink-0" />
                  )}
                  <span className="truncate">{ch.name}</span>
                  {locked && <FiLock className="ml-auto h-3 w-3 shrink-0" />}
                  {ch.is_restricted && !locked && (
                    <FiLock className="ml-auto h-3 w-3 shrink-0 opacity-50" />
                  )}
                </button>

                {/* Admin controls */}
                {canManage && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditId(editId === ch.id ? null : ch.id);
                    }}
                    className={`absolute right-1 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground opacity-0 transition-opacity hover:bg-foreground/10 group-hover:opacity-100 ${
                      editId === ch.id ? "opacity-100" : ""
                    }`}
                    title="Manage"
                  >
                    ⚙
                  </button>
                )}

                {/* Inline edit panel */}
                {editId === ch.id && (
                  <ChannelEditPanel
                    channel={ch}
                    communityId={communityId}
                    onUpdate={(data) => {
                      updateMut.mutate(
                        { channelId: ch.id, data },
                        {
                          onSuccess: () => toast.success("Channel updated"),
                          onError: () => toast.error("Update failed"),
                        },
                      );
                    }}
                    onDelete={() => handleDelete(ch)}
                  />
                )}
              </div>
            );
          })}
          {!channels?.length && (
            <p className="px-2 py-4 text-xs text-muted-foreground">No channels yet.</p>
          )}
        </div>

        {/* Create button */}
        {canManage && (
          <div className="border-t border-border p-2">
            {showCreate ? (
              <CreateChannelForm onCreate={handleCreate} onCancel={() => setShowCreate(false)} />
            ) : (
              <button
                onClick={() => setShowCreate(true)}
                className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <FiPlus className="h-3.5 w-3.5" /> New Channel
              </button>
            )}
          </div>
        )}
      </div>

      {/* Center content */}
      <div className="flex-1 overflow-hidden">{renderCenter()}</div>
      {dialog}
    </div>
  );
}

// ── Create form ───────────────────────────────────────────────────────
function CreateChannelForm({
  onCreate,
  onCancel,
}: {
  onCreate: (data: { name: string; slug: string; type: string; is_restricted: boolean }) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState("text");
  const [restricted, setRestricted] = useState(false);

  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9- ]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return (
    <div className="space-y-2 p-1">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Channel name"
        className="w-full rounded border border-input bg-transparent px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
      />
      <select
        value={type}
        onChange={(e) => setType(e.target.value)}
        className="w-full rounded border border-input bg-transparent px-2 py-1 text-sm"
      >
        <option value="text">Text</option>
        <option value="announcement">Announcement</option>
        <option value="live">Live</option>
      </select>
      <label className="flex items-center gap-2 text-xs text-muted-foreground">
        <input
          type="checkbox"
          checked={restricted}
          onChange={(e) => setRestricted(e.target.checked)}
        />
        Restricted (members need explicit access)
      </label>
      <div className="flex gap-1">
        <Button
          size="sm"
          className="flex-1"
          disabled={!name.trim()}
          onClick={() => onCreate({ name, slug, type, is_restricted: restricted })}
        >
          Create
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>
          ✕
        </Button>
      </div>
    </div>
  );
}

// ── Edit panel ────────────────────────────────────────────────────────
function ChannelEditPanel({
  channel,
  communityId,
  onUpdate,
  onDelete,
}: {
  channel: Channel;
  communityId: string;
  onUpdate: (data: { name?: string; is_restricted?: boolean }) => void;
  onDelete: () => void;
}) {
  const [name, setName] = useState(channel.name);
  const [restricted, setRestricted] = useState(channel.is_restricted);
  const { data: members } = useChannelMembers(communityId, channel.id);

  return (
    <div className="mb-1 ml-2 rounded-md border border-border bg-card p-2 text-xs">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="mb-1 w-full rounded border border-input bg-transparent px-1.5 py-1 text-xs"
      />
      <label className="mb-1 flex items-center gap-1.5">
        <input
          type="checkbox"
          checked={restricted}
          onChange={(e) => setRestricted(e.target.checked)}
        />
        Restricted
      </label>
      <div className="flex gap-1">
        <Button
          size="sm"
          className="flex-1"
          onClick={() => onUpdate({ name, is_restricted: restricted })}
        >
          Save
        </Button>
        {!["general", "announcements", "live"].includes(channel.slug) && (
          <Button size="sm" variant="ghost" onClick={onDelete}>
            <FiTrash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {/* Members (restricted channels) */}
      {channel.is_restricted && members && (
        <div className="mt-2 border-t border-border pt-2">
          <div className="mb-1 font-medium">Members ({members.length})</div>
          {members.length === 0 && <p className="text-muted-foreground">No members added.</p>}
          {members.map((m) => (
            <div key={m.user_id} className="flex items-center justify-between py-0.5">
              <span>{m.display_name}</span>
              <span className="flex gap-1 text-[10px] text-muted-foreground">
                {m.can_read ? "📖" : ""}
                {m.can_write ? "✏️" : ""}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
