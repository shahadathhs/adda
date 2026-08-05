import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FiVideoOff } from "react-icons/fi";
import toast from "react-hot-toast";
import { Avatar } from "../components/ui/Avatar";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import ChatPanel from "../components/ChatPanel";
import CopyField from "../components/CopyField";
import LivePlayer from "../components/LivePlayer";
import { api } from "../lib/api";
import { useAuthStore } from "../store/auth-store";
import { HLS_BASE_URL, API_BASE_URL } from "../config";
import type { Community, Recording, StreamCredentials } from "../types";

const TABS = ["Posts", "Live", "Media", "Files", "Members", "Recordings"] as const;
type Tab = (typeof TABS)[number];

function ComingSoon({ label }: { label: string }) {
  return (
    <Card className="p-10 text-center text-sm text-muted-foreground">
      {label} — coming soon in the next iteration.
    </Card>
  );
}

function fmtSize(n: number) {
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function RecordingsPanel({ communityId }: { communityId: string }) {
  const [recs, setRecs] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<Recording | null>(null);

  useEffect(() => {
    setLoading(true);
    api
      .recordings(communityId)
      .then((r) => setRecs(r))
      .catch(() => toast.error("Failed to load recordings"))
      .finally(() => setLoading(false));
  }, [communityId]);

  const src = active
    ? `${API_BASE_URL}/api/recordings/file?path=${encodeURIComponent(active.path)}`
    : null;

  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (recs.length === 0)
    return (
      <Card className="flex aspect-video flex-col items-center justify-center gap-2 px-6 text-center">
        <p className="text-sm font-medium">No recordings yet</p>
        <p className="max-w-sm text-xs text-muted-foreground">
          Recordings show up here automatically after a stream ends.
        </p>
      </Card>
    );

  return (
    <div className="space-y-4">
      {src && (
        <video
          key={src}
          controls
          autoPlay
          className="aspect-video w-full rounded-lg bg-black"
          src={src}
        />
      )}
      <Card className="divide-y divide-border">
        {recs.map((r) => (
          <button
            key={r.path}
            onClick={() => setActive(r)}
            className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm transition-colors hover:bg-muted/50 ${
              active?.path === r.path ? "bg-muted/50" : ""
            }`}
          >
            <div className="min-w-0">
              <div className="truncate font-medium">
                {new Date(r.created_at).toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">{fmtSize(r.size_bytes)}</div>
            </div>
            <span className="shrink-0 text-xs text-primary">
              {active?.path === r.path ? "Playing" : "Play"}
            </span>
          </button>
        ))}
      </Card>
    </div>
  );
}

export default function CommunityPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [community, setCommunity] = useState<Community | null>(null);
  const [tab, setTab] = useState<Tab>("Live");
  const [isLive, setIsLive] = useState(false);
  const [creds, setCreds] = useState<StreamCredentials | null>(null);
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

  // Owner-only: load the stream URL + key for the OBS setup panel.
  useEffect(() => {
    if (!id || !user || community?.owner_id !== user.id) {
      setCreds(null);
      return;
    }
    api.getStreamKey(id).then(setCreds).catch(() => setCreds(null));
  }, [id, user, community?.owner_id]);

  const rotateKey = async () => {
    if (!id) return;
    try {
      setCreds(await api.rotateStreamKey(id));
      toast.success("Stream key rotated — update OBS with the new URL.");
    } catch {
      toast.error("Could not rotate the stream key");
    }
  };

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
  const showPlayer = isLive;

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
            {tab === "Live" && (
              <div className="space-y-4">
                {showPlayer ? (
                  <LivePlayer hlsUrl={hlsUrl} />
                ) : (
                  <Card className="flex aspect-video flex-col items-center justify-center gap-3 px-6 text-center">
                    <FiVideoOff className="h-10 w-10 text-muted-foreground/40" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-foreground">No live stream</p>
                      <p className="max-w-sm text-xs text-muted-foreground">
                        {isOwner
                          ? "Start broadcasting in OBS to go live — grab your URL from “Stream setup” below."
                          : "This community isn't broadcasting right now. Check back soon."}
                      </p>
                    </div>
                  </Card>
                )}

                {isOwner && creds && (
                  <Card className="space-y-3 p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold">Stream setup (OBS)</h3>
                      <Button variant="outline" size="sm" onClick={rotateKey}>
                        Rotate key
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Paste the <strong>Stream URL</strong> into OBS → Settings →
                      Stream → Server, and leave the Stream Key field empty.
                    </p>
                    <CopyField label="Stream URL" value={creds.stream_url} />
                    <CopyField label="Stream Key" value={creds.stream_key} />
                  </Card>
                )}
              </div>
            )}
            {tab === "Posts" && <ComingSoon label="Announcements & posts" />}
            {tab === "Media" && <ComingSoon label="Photo / video gallery" />}
            {tab === "Files" && <ComingSoon label="Shared files" />}
            {tab === "Members" && <ComingSoon label="Member list" />}
            {tab === "Recordings" && <RecordingsPanel communityId={community.id} />}
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
