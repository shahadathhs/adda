import { useState } from "react";
import { toast } from "sonner";
import { UserAvatar } from "@/shared/ui/user-avatar";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import {
  useAdminDeleteUser,
  useAdminResetUserPassword,
  useAdminUpdateUser,
  useAdminUsers,
} from "@/features/admin/hooks";
import type { AdminUser } from "@/features/admin/types";

export function UsersTab({ selfId }: { selfId?: string }) {
  const [q, setQ] = useState("");
  const [search, setSearch] = useState<string | undefined>(undefined);
  const { data: users = [], isLoading: loading } = useAdminUsers(search);
  const updateMutation = useAdminUpdateUser();
  const resetMutation = useAdminResetUserPassword();
  const deleteMutation = useAdminDeleteUser();

  const update = (u: AdminUser, patch: { is_admin?: boolean; is_active?: boolean }) =>
    updateMutation.mutate(
      { id: u.id, data: patch },
      { onError: (e) => toast.error(e instanceof Error ? e.message : "Failed") },
    );

  const resetPw = (u: AdminUser) => {
    const password = window.prompt(`New password for ${u.username} (min 8 chars):`);
    if (!password) return;
    resetMutation.mutate(
      { id: u.id, password },
      {
        onSuccess: () => toast.success("Password reset"),
        onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
      },
    );
  };

  const remove = (u: AdminUser) => {
    if (!window.confirm(`Delete ${u.username}? Removes their communities/memberships too.`)) return;
    deleteMutation.mutate(u.id, {
      onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
    });
  };

  return (
    <div className="space-y-3">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setSearch(q || undefined);
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
                        <UserAvatar name={u.display_name} className="h-7 w-7 text-xs" />
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
