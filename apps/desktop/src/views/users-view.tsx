import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  adminDeleteUser,
  adminResetUserPassword,
  adminUpdateUser,
  adminUsers,
} from "@adda/api-client";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/ui/dialog";
import { Input } from "@/ui/input";
import { EmptyRow, Table, Td, Th, Tr } from "@/ui/table";
import { Panel, PanelHeader } from "@/ui/panel";
import { consoleKeys } from "@/lib/data";

const ROLES = ["user", "admin", "superadmin"] as const;

export function UsersView() {
  const [q, setQ] = useState("");
  const { data: users = [], isLoading } = useQuery({
    queryKey: consoleKeys.users(q),
    queryFn: () => adminUsers(q || undefined),
  });
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: consoleKeys.users(q) });

  const update = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { system_role?: string; is_active?: boolean };
    }) => adminUpdateUser(id, data),
    onSuccess: () => {
      toast.success("User updated");
      invalidate();
    },
    onError: () => toast.error("Update failed"),
  });
  const resetPw = useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) =>
      adminResetUserPassword(id, password),
    onSuccess: () => toast.success("Password reset"),
    onError: () => toast.error("Reset failed"),
  });
  const remove = useMutation({
    mutationFn: adminDeleteUser,
    onSuccess: () => {
      toast.success("User deleted");
      invalidate();
    },
    onError: () => toast.error("Delete failed"),
  });

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-sm font-semibold">Users</h1>
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search email / username…"
          className="w-64"
        />
      </div>

      <Panel>
        <PanelHeader title={`${users.length} users`} />
        <Table>
          <thead>
            <tr>
              <Th>User</Th>
              <Th className="w-32">Role</Th>
              <Th className="w-24">Status</Th>
              <Th className="w-56 text-right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <Td colSpan={4} className="py-8 text-center text-muted">
                  Loading…
                </Td>
              </tr>
            )}
            {!isLoading && users.length === 0 && <EmptyRow colSpan={4} label="No users found." />}
            {users.map((u) => (
              <Tr key={u.id}>
                <Td>
                  <p className="font-medium">{u.display_name}</p>
                  <p className="text-2xs text-muted">
                    {u.email} · @{u.username}
                  </p>
                </Td>
                <Td>
                  <select
                    value={u.system_role}
                    onChange={(e) =>
                      update.mutate({ id: u.id, data: { system_role: e.target.value } })
                    }
                    className="h-6 rounded-xs border border-line bg-panel2 px-1 text-2xs"
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </Td>
                <Td>
                  {u.is_active ? (
                    <Badge tone="ok">Active</Badge>
                  ) : (
                    <Badge tone="danger">Suspended</Badge>
                  )}
                </Td>
                <Td className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => update.mutate({ id: u.id, data: { is_active: !u.is_active } })}
                    >
                      {u.is_active ? "Suspend" : "Activate"}
                    </Button>
                    <ResetPasswordDialog
                      onConfirm={(pw) => resetPw.mutate({ id: u.id, password: pw })}
                      pending={resetPw.isPending}
                    />
                    <Button variant="danger" size="xs" onClick={() => remove.mutate(u.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </Panel>
    </div>
  );
}

function ResetPasswordDialog({
  onConfirm,
  pending,
}: {
  onConfirm: (password: string) => void;
  pending: boolean;
}) {
  const [pw, setPw] = useState("");
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="xs">
          Reset password
        </Button>
      </DialogTrigger>
      <DialogContent title="Reset password">
        <p className="mb-2 text-2xs text-muted">
          Set a new password for this user (they should change it after signing in).
        </p>
        <Input
          type="text"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          placeholder="New password (min 8 chars)"
          className="font-num"
          autoFocus
        />
        <div className="mt-3 flex justify-end gap-2">
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm">
              Cancel
            </Button>
          </DialogTrigger>
          <Button
            variant="primary"
            size="sm"
            disabled={pending || pw.length < 8}
            onClick={() => onConfirm(pw)}
          >
            Reset
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
