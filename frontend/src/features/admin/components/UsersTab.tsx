import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Avatar } from "@/shared/ui/Avatar";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { Input } from "@/shared/ui/Input";
import {
  adminDeleteUser,
  adminResetUserPassword,
  adminUpdateUser,
  adminUsers,
} from "@/features/admin/api";
import type { AdminUser } from "@/features/admin/types";

export function UsersTab({ selfId }: { selfId?: string }) {
  const [q, setQ] = useState("");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  const load = (query?: string) => {
    setLoading(true);
    adminUsers(query)
      .then(setUsers)
      .catch(() => toast.error("Failed to load users"))
      .finally(() => setLoading(false));
  };
  useEffect(() => load(), []);

  const update = async (u: AdminUser, patch: { is_admin?: boolean; is_active?: boolean }) => {
    try {
      const updated = await adminUpdateUser(u.id, patch);
      setUsers((p) => p.map((x) => (x.id === u.id ? updated : x)));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  const resetPw = async (u: AdminUser) => {
    const password = window.prompt(`New password for ${u.username} (min 8 chars):`);
    if (!password) return;
    try {
      await adminResetUserPassword(u.id, password);
      toast.success("Password reset");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  const remove = async (u: AdminUser) => {
    if (!window.confirm(`Delete ${u.username}? Removes their communities/memberships too.`)) return;
    try {
      await adminDeleteUser(u.id);
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
        <Input
          placeholder="Search username or email"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <Button type="submit" variant="outline">
          Search
        </Button>
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
              <tr>
                <td colSpan={4} className="p-6 text-center text-muted-foreground">
                  Loading…
                </td>
              </tr>
            ) : (
              users.map((u) => {
                const self = u.id === selfId;
                return (
                  <tr key={u.id} className="border-b border-border/60 last:border-0">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Avatar name={u.display_name} className="h-7 w-7 text-xs" />
                        <div>
                          <div className="font-medium">
                            {u.display_name}{" "}
                            {self && <span className="text-xs text-muted-foreground">(you)</span>}
                          </div>
                          <div className="text-xs text-muted-foreground">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-col gap-1">
                        {u.is_admin && (
                          <span className="w-fit rounded bg-purple-500/20 px-2 py-0.5 text-xs text-purple-300">
                            admin
                          </span>
                        )}
                        {!u.is_active && (
                          <span className="w-fit rounded bg-red-500/20 px-2 py-0.5 text-xs text-red-300">
                            suspended
                          </span>
                        )}
                        {u.is_active && !u.is_admin && (
                          <span className="text-xs text-muted-foreground">active</span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-xs text-muted-foreground">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap justify-end gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={self}
                          onClick={() => update(u, { is_admin: !u.is_admin })}
                        >
                          {u.is_admin ? "Demote" : "Promote"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={self}
                          onClick={() => update(u, { is_active: !u.is_active })}
                        >
                          {u.is_active ? "Suspend" : "Activate"}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => resetPw(u)}>
                          Reset pw
                        </Button>
                        <Button size="sm" variant="ghost" disabled={self} onClick={() => remove(u)}>
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
