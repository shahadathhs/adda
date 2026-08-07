import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { adminCommunities, adminDeleteRecording, adminRecordings } from "@/features/admin/api";
import type { AdminCommunity } from "@/features/admin/types";
import type { Recording } from "@/features/recordings/types";

function fmtBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function RecordingsTab() {
  const [items, setItems] = useState<Recording[]>([]);
  const [communities, setCommunities] = useState<AdminCommunity[]>([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    Promise.all([adminRecordings(filter || undefined), adminCommunities()])
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
      await adminDeleteRecording(r.path);
      setItems((p) => p.filter((x) => x.path !== r.path));
      toast.success("Recording deleted");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  const nameFor = (id: string | null) =>
    id ? (communities.find((c) => c.id === id)?.name ?? id.slice(0, 8)) : "unknown";

  return (
    <div className="space-y-3">
      <select
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="rounded border border-border bg-background px-3 py-1.5 text-sm"
      >
        <option value="">All communities</option>
        {communities.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
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
                  <td className="p-3 text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleString()}
                  </td>
                  <td className="p-3 text-right">
                    <Button size="sm" variant="ghost" onClick={() => remove(r)}>
                      Delete
                    </Button>
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
