import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import {
  useAdminCommunities,
  useAdminDeleteRecording,
  useAdminRecordings,
} from "@/features/admin/hooks";
import type { Recording } from "@/features/recordings/types";

function fmtBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function RecordingsTab() {
  const [filter, setFilter] = useState("");
  const { data: items = [], isLoading: loading } = useAdminRecordings(filter || undefined);
  const { data: communities = [] } = useAdminCommunities();
  const deleteMutation = useAdminDeleteRecording();

  const remove = (r: Recording) => {
    if (!window.confirm(`Delete recording ${r.name}?`)) return;
    deleteMutation.mutate(r.path, {
      onSuccess: () => toast.success("Recording deleted"),
      onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
    });
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
