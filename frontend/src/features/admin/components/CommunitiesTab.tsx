import { Fragment, useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import toast from "react-hot-toast";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import {
  adminCommunities,
  adminDeleteCommunity,
  adminStopStream,
  adminUpdateCommunity,
} from "@/features/admin/api";
import type { AdminCommunity } from "@/features/admin/types";
import { CommunityManager } from "./CommunityManager";

export function CommunitiesTab() {
  const [items, setItems] = useState<AdminCommunity[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);

  const load = () =>
    adminCommunities()
      .then(setItems)
      .catch(() => toast.error("Failed to load"));
  useEffect(() => {
    load();
  }, []);

  const toggleSuspend = async (c: AdminCommunity) => {
    try {
      const updated = await adminUpdateCommunity(c.id, { is_suspended: !c.is_suspended });
      setItems((p) => p.map((x) => (x.id === c.id ? updated : x)));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  const stop = async (c: AdminCommunity) => {
    try {
      await adminStopStream(c.id);
      toast.success("Stream stopped");
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  const remove = async (c: AdminCommunity) => {
    if (!window.confirm(`Delete community ${c.name}?`)) return;
    try {
      await adminDeleteCommunity(c.id);
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
            <tr>
              <td colSpan={4} className="p-6 text-center text-muted-foreground">
                No communities.
              </td>
            </tr>
          ) : (
            items.map((c) => (
              <Fragment key={c.id}>
                <tr className="border-b border-border/60 last:border-0">
                  <td className="p-3">
                    <Link
                      to="/community/$id"
                      params={{ id: c.id }}
                      className="font-medium hover:underline"
                    >
                      {c.name}
                    </Link>
                    <div className="text-xs text-muted-foreground">@{c.slug}</div>
                  </td>
                  <td className="p-3 text-muted-foreground">{c.member_count}</td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      {c.is_live && (
                        <span className="rounded bg-red-500/20 px-2 py-0.5 text-xs text-red-300">
                          LIVE
                        </span>
                      )}
                      {c.is_suspended && (
                        <span className="rounded bg-yellow-500/20 px-2 py-0.5 text-xs text-yellow-300">
                          suspended
                        </span>
                      )}
                      {!c.is_live && !c.is_suspended && (
                        <span className="text-xs text-muted-foreground">ok</span>
                      )}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap justify-end gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setOpenId(openId === c.id ? null : c.id)}
                      >
                        {openId === c.id ? "Close" : "Manage"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={!c.is_live}
                        onClick={() => stop(c)}
                      >
                        Stop
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => toggleSuspend(c)}>
                        {c.is_suspended ? "Unsuspend" : "Suspend"}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => remove(c)}>
                        Delete
                      </Button>
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
