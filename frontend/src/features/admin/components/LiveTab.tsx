import { Link } from "@tanstack/react-router";
import toast from "react-hot-toast";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { useAdminLive, useAdminStopStream } from "@/features/admin/hooks";

export function LiveTab() {
  const { data: items = [], isLoading: loading } = useAdminLive();
  const stopMutation = useAdminStopStream();

  const stop = (id: string) =>
    stopMutation.mutate(id, {
      onSuccess: () => toast.success("Stream stopped"),
      onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
    });

  if (loading) return <p className="text-muted-foreground">Loading…</p>;
  if (items.length === 0)
    return (
      <Card className="p-10 text-center text-sm text-muted-foreground">
        No live streams right now.
      </Card>
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
                <Link
                  to="/community/$id"
                  params={{ id: s.community_id }}
                  className="font-medium hover:underline"
                >
                  {s.name}
                </Link>
              </td>
              <td className="p-3 text-muted-foreground">{s.viewers}</td>
              <td className="p-3 text-right">
                <Button size="sm" variant="outline" onClick={() => stop(s.community_id)}>
                  Force stop
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
