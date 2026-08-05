import { Fragment, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { Avatar } from "../components/ui/Avatar";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import CopyField from "../components/CopyField";
import { api } from "../lib/api";
import { useAuthStore } from "../store/auth-store";
import type {
  AdminCommunity,
  AdminMember,
  AdminStats,
  AdminUser,
  LiveStream,
  Recording,
  StreamCredentials,
} from "../types";

const TABS = ["Users", "Communities", "Live", "Recordings"] as const;
type Tab = (typeof TABS)[number];

function fmtBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function StatCard({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <Card className="p-4">
      <div className={`text-2xl font-bold ${accent ?? ""}`}>{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </Card>
  );
}

export default function AdminPage() {
  const { user } = useAuthStore();
  const [tab, setTab] = useState<Tab>("Users");
  const [stats, setStats] = useState<AdminStats | null>(null);

  useEffect(() => {
    api.adminStats().then(setStats).catch(() => {});
  }, [tab]);

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Admin</h1>
        <p className="text-sm text-muted-foreground">Platform overview & management.</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Users" value={stats?.users ?? 0} />
        <StatCard label="Communities" value={stats?.communities ?? 0} />
        <StatCard label="Live now" value={stats?.live ?? 0} accent="text-red-400" />
      </div>

      <div className="flex gap-1 border-b border-border">
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

      {tab === "Users" && <UsersTab selfId={user?.id} />}
      {tab === "Communities" && <CommunitiesTab />}
      {tab === "Live" && <LiveTab />}
      {tab === "Recordings" && <RecordingsTab />}
    </div>
  );
}

/* ── Users ── */
function UsersTab({ selfId }: { selfId?: string }) {
  const [q, setQ] = useState("");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  const load = (query?: string) => {
    setLoading(true);
    api
      .adminUsers(query)
      .then(setUsers)
      .catch(() => toast.error("Failed to load users"))
      .finally(() => setLoading(false));
  };
  useEffect(() => load(), []);

  const update = async (u: AdminUser, patch: { is_admin?: boolean; is_active?: boolean }) => {
    try {
      const updated = await api.adminUpdateUser(u.id, patch);
      setUsers((p) => p.map((x) => (x.id === u.id ? updated : x)));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  const resetPw = async (u: AdminUser) => {
    const password = window.prompt(`New password for ${u.username} (min 8 chars):`);
    if (!password) return;
    try {
      await api.adminResetUserPassword(u.id, password);
      toast.success("Password reset");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  const remove = async (u: AdminUser) => {
    if (!window.confirm(`Delete ${u.username}? Removes their communities/memberships too.`)) return;
    try {
      await api.adminDeleteUser(u.id);
      setUsers((p) => p.filter((x) => x.id !== u.id));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  return (
    <div className="space-y-3">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          load(q);
        }}
        className="flex gap-2"
      >
        <Input placeholder="Search username or email" value={q} onChange={(e) => setQ(e.target.value)} />
        <Button type="submit" variant="outline">Search</Button>
      </form>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-border text-left text-xs text-muted-foreground">
            <tr>
              <th className="p-3 font-medium">User</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium">Joined</th>
              <th className="p-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">Loading…</td></tr>
            ) : users.map((u) => {
              const self = u.id === selfId;
              return (
                <tr key={u.id} className="border-b border-border/60 last:border-0">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <Avatar name={u.display_name} className="h-7 w-7 text-xs" />
                      <div>
                        <div className="font-medium">{u.display_name} {self && <span className="text-xs text-muted-foreground">(you)</span>}</div>
                        <div className="text-xs text-muted-foreground">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex flex-col gap-1">
                      {u.is_admin && <span className="w-fit rounded bg-purple-500/20 px-2 py-0.5 text-xs text-purple-300">admin</span>}
                      {!u.is_active && <span className="w-fit rounded bg-red-500/20 px-2 py-0.5 text-xs text-red-300">suspended</span>}
                      {u.is_active && !u.is_admin && <span className="text-xs text-muted-foreground">active</span>}
                    </div>
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</td>
                  <td className="p-3">
                    <div className="flex flex-wrap justify-end gap-1">
                      <Button size="sm" variant="outline" disabled={self} onClick={() => update(u, { is_admin: !u.is_admin })}>
                        {u.is_admin ? "Demote" : "Promote"}
                      </Button>
                      <Button size="sm" variant="outline" disabled={self} onClick={() => update(u, { is_active: !u.is_active })}>
                        {u.is_active ? "Suspend" : "Activate"}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => resetPw(u)}>Reset pw</Button>
                      <Button size="sm" variant="ghost" disabled={self} onClick={() => remove(u)}>Delete</Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

/* ── Communities ── */
function CommunitiesTab() {
  const [items, setItems] = useState<AdminCommunity[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);

  const load = () => api.adminCommunities().then(setItems).catch(() => toast.error("Failed to load"));
  useEffect(() => {
    load();
  }, []);

  const toggleSuspend = async (c: AdminCommunity) => {
    try {
      const updated = await api.adminUpdateCommunity(c.id, { is_suspended: !c.is_suspended });
      setItems((p) => p.map((x) => (x.id === c.id ? updated : x)));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  const stop = async (c: AdminCommunity) => {
    try {
      await api.adminStopStream(c.id);
      toast.success("Stream stopped");
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  const remove = async (c: AdminCommunity) => {
    if (!window.confirm(`Delete community ${c.name}?`)) return;
    try {
      await api.adminDeleteCommunity(c.id);
      setItems((p) => p.filter((x) => x.id !== c.id));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  return (
    <Card className="overflow-hidden">
      <table className="w-full text-sm">
        <thead className="border-b border-border text-left text-xs text-muted-foreground">
          <tr>
            <th className="p-3 font-medium">Community</th>
            <th className="p-3 font-medium">Members</th>
            <th className="p-3 font-medium">Status</th>
            <th className="p-3 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">No communities.</td></tr>
          ) : (
            items.map((c) => (
              <Fragment key={c.id}>
                <tr className="border-b border-border/60 last:border-0">
                  <td className="p-3">
                    <Link to={`/community/${c.id}`} className="font-medium hover:underline">{c.name}</Link>
                    <div className="text-xs text-muted-foreground">@{c.slug}</div>
                  </td>
                  <td className="p-3 text-muted-foreground">{c.member_count}</td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      {c.is_live && <span className="rounded bg-red-500/20 px-2 py-0.5 text-xs text-red-300">LIVE</span>}
                      {c.is_suspended && <span className="rounded bg-yellow-500/20 px-2 py-0.5 text-xs text-yellow-300">suspended</span>}
                      {!c.is_live && !c.is_suspended && <span className="text-xs text-muted-foreground">ok</span>}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap justify-end gap-1">
                      <Button size="sm" variant="outline" onClick={() => setOpenId(openId === c.id ? null : c.id)}>
                        {openId === c.id ? "Close" : "Manage"}
                      </Button>
                      <Button size="sm" variant="outline" disabled={!c.is_live} onClick={() => stop(c)}>Stop</Button>
                      <Button size="sm" variant="outline" onClick={() => toggleSuspend(c)}>
                        {c.is_suspended ? "Unsuspend" : "Suspend"}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => remove(c)}>Delete</Button>
                    </div>
                  </td>
                </tr>
                {openId === c.id && (
                  <tr className="border-b border-border/60 bg-muted/20">
                    <td colSpan={4} className="p-4">
                      <CommunityManager community={c} />
                    </td>
                  </tr>
                )}
              </Fragment>
            ))
          )}
        </tbody>
      </table>
    </Card>
  );
}

function CommunityManager({ community }: { community: AdminCommunity }) {
  const [members, setMembers] = useState<AdminMember[]>([]);
  const [creds, setCreds] = useState<StreamCredentials | null>(null);

  useEffect(() => {
    api.adminCommunityMembers(community.id).then(setMembers).catch(() => {});
    api.adminCommunityStreamKey(community.id).then(setCreds).catch(() => {});
  }, [community.id]);

  const kick = async (m: AdminMember) => {
    if (!window.confirm(`Remove ${m.username} from this community?`)) return;
    try {
      await api.adminKickMember(community.id, m.user_id);
      setMembers((p) => p.filter((x) => x.user_id !== m.user_id));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  const rotate = async () => {
    if (!window.confirm("Rotate the stream key? The current OBS connection will be kicked.")) return;
    try {
      setCreds(await api.adminRotateCommunityKey(community.id));
      toast.success("Key rotated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div>
        <h4 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Members</h4>
        <div className="space-y-1">
          {members.map((m) => (
            <div key={m.user_id} className="flex items-center justify-between rounded bg-background/50 px-2 py-1 text-sm">
              <div className="flex items-center gap-2">
                <Avatar name={m.display_name} className="h-6 w-6 text-xs" />
                <span>{m.display_name}</span>
                <span className="text-xs text-muted-foreground">{m.role}</span>
              </div>
              <Button size="sm" variant="ghost" disabled={m.role === "owner"} onClick={() => kick(m)}>
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
          <Button size="sm" variant="outline" onClick={rotate}>Rotate</Button>
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

/* ── Live ── */
function LiveTab() {
  const [items, setItems] = useState<LiveStream[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => api.adminLive().then(setItems).finally(() => setLoading(false));
  useEffect(() => {
    load();
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, []);

  const stop = async (id: string) => {
    try {
      await api.adminStopStream(id);
      toast.success("Stream stopped");
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  if (loading) return <p className="text-muted-foreground">Loading…</p>;
  if (items.length === 0)
    return (
      <Card className="p-10 text-center text-sm text-muted-foreground">No live streams right now.</Card>
    );

  return (
    <Card className="overflow-hidden">
      <table className="w-full text-sm">
        <thead className="border-b border-border text-left text-xs text-muted-foreground">
          <tr>
            <th className="p-3 font-medium">Community</th>
            <th className="p-3 font-medium">Viewers</th>
            <th className="p-3 text-right font-medium">Action</th>
          </tr>
        </thead>
        <tbody>
          {items.map((s) => (
            <tr key={s.community_id} className="border-b border-border/60 last:border-0">
              <td className="p-3">
                <Link to={`/community/${s.community_id}`} className="font-medium hover:underline">{s.name}</Link>
              </td>
              <td className="p-3 text-muted-foreground">{s.viewers}</td>
              <td className="p-3 text-right">
                <Button size="sm" variant="outline" onClick={() => stop(s.community_id)}>Force stop</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

/* ── Recordings ── */
function RecordingsTab() {
  const [items, setItems] = useState<Recording[]>([]);
  const [communities, setCommunities] = useState<AdminCommunity[]>([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    Promise.all([api.adminRecordings(filter || undefined), api.adminCommunities()])
      .then(([recs, comms]) => {
        setItems(recs);
        setCommunities(comms);
      })
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const remove = async (r: Recording) => {
    if (!window.confirm(`Delete recording ${r.name}?`)) return;
    try {
      await api.adminDeleteRecording(r.path);
      setItems((p) => p.filter((x) => x.path !== r.path));
      toast.success("Recording deleted");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  const nameFor = (id: string | null) =>
    id ? communities.find((c) => c.id === id)?.name ?? id.slice(0, 8) : "unknown";

  return (
    <div className="space-y-3">
      <select
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="rounded border border-border bg-background px-3 py-1.5 text-sm"
      >
        <option value="">All communities</option>
        {communities.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>

      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : items.length === 0 ? (
        <Card className="p-10 text-center text-sm text-muted-foreground">No recordings.</Card>
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left text-xs text-muted-foreground">
              <tr>
                <th className="p-3 font-medium">File</th>
                <th className="p-3 font-medium">Community</th>
                <th className="p-3 font-medium">Size</th>
                <th className="p-3 font-medium">Date</th>
                <th className="p-3 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <tr key={r.path} className="border-b border-border/60 last:border-0">
                  <td className="p-3 font-mono text-xs">{r.name}</td>
                  <td className="p-3 text-muted-foreground">{nameFor(r.community_id)}</td>
                  <td className="p-3 text-muted-foreground">{fmtBytes(r.size_bytes)}</td>
                  <td className="p-3 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</td>
                  <td className="p-3 text-right">
                    <Button size="sm" variant="ghost" onClick={() => remove(r)}>Delete</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
