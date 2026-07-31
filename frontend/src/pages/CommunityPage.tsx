import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { Avatar } from "../components/ui/Avatar";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import ChatPanel from "../components/ChatPanel";
import LivePlayer from "../components/LivePlayer";
import { api } from "../lib/api";
import { useAuthStore } from "../store/auth-store";
import { HLS_BASE_URL } from "../config";
import type { Community } from "../types";

const TABS = ["Posts", "Live", "Media", "Files", "Members", "Recordings"] as const;
type Tab = (typeof TABS)[number];

function ComingSoon({ label }: { label: string }) {
  return (
    <Card className="p-10 text-center text-sm text-muted-foreground">
      {label} — coming soon in the next iteration.
    </Card>
  );
}

export default function CommunityPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [community, setCommunity] = useState<Community | null>(null);
  const [tab, setTab] = useState<Tab>("Live");
  const [isLive, setIsLive] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const c = await api.getCommunity(id);
        setCommunity(c);
        setIsLive(c.is_live);
      } catch {
        toast.error("Community not found");
        navigate("/");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, navigate]);

  // Poll stream status while on the Live tab (cheap; mediamtx API).
  useEffect(() => {
    if (!id || tab !== "Live") return;
    const t = setInterval(async () => {
      try {
        const s = await api.streamStatus(id);
        setIsLive(s.is_live);
      } catch {
        /* ignore */
      }
    }, 5000);
    return () => clearInterval(t);
  }, [id, tab]);

  if (loading || !community) {
    return <div className="p-6 text-muted-foreground">Loading…</div>;
  }

  const hlsUrl = `${HLS_BASE_URL}/community/${community.id}/index.m3u8`;
  const isOwner = community.owner_id === user?.id;

  return (
    <div className="flex h-full flex-col">
      {/* Banner */}
      <div className="h-32 bg-gradient-to-r from-primary/40 to-purple-500/40" />
      <div className="mx-auto w-full max-w-6xl px-6">
        <div className="-mt-10 flex items-end gap-4">
          <Avatar name={community.name} src={community.avatar_url} className="h-20 w-20 text-2xl ring-4 ring-background" />
          <div className="flex-1 pb-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{community.name}</h1>
              {isLive && (
                <span className="flex items-center gap-1 rounded-full bg-red-500/20 px-2 py-0.5 text-xs font-medium text-red-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500" /> LIVE
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {community.description || `@${community.slug}`} · {community.member_count} members
            </p>
          </div>
          <Button variant={isOwner ? "outline" : "default"} size="sm">
            {isOwner ? "Your community" : "Joined"}
          </Button>
        </div>

        {/* Tabs */}
        <div className="mt-4 flex gap-1 border-b border-border">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Body: content + chat */}
        <div className="grid gap-4 py-4 md:grid-cols-[1fr_320px]">
          <div className="min-h-[400px]">
            {tab === "Live" &&
              (isLive ? (
                <LivePlayer hlsUrl={hlsUrl} />
              ) : (
                <Card className="flex aspect-video items-center justify-center text-sm text-muted-foreground">
                  No active stream. {isOwner && "Go live with OBS → rtmp://localhost:1935/community/" + community.id}
                </Card>
              ))}
            {tab === "Posts" && <ComingSoon label="Announcements & posts" />}
            {tab === "Media" && <ComingSoon label="Photo / video gallery" />}
            {tab === "Files" && <ComingSoon label="Shared files" />}
            {tab === "Members" && <ComingSoon label="Member list" />}
            {tab === "Recordings" && <ComingSoon label="Recording library" />}
          </div>

          {/* Persistent chat rail */}
          <Card className="h-[600px] overflow-hidden">
            <ChatPanel communityId={community.id} />
          </Card>
        </div>
      </div>
    </div>
  );
}
