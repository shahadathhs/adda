"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { changePassword, setPassword as setPasswordApi } from "@adda/api-client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function PasswordCard({ hasPassword }: { hasPassword: boolean }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");

  const change = useMutation({
    mutationFn: () => changePassword(current, next),
    onSuccess: () => {
      toast.success("Password changed");
      setCurrent("");
      setNext("");
      setConfirm("");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Change failed"),
  });
  const setInitial = useMutation({
    mutationFn: () => setPasswordApi(next),
    onSuccess: () => {
      toast.success("Password set");
      setNext("");
      setConfirm("");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not set password"),
  });

  return (
    <Card className="space-y-3 p-4">
      <h2 className="font-display font-bold tracking-tight">
        {hasPassword ? "Change password" : "Set a password"}
      </h2>
      {hasPassword && (
        <Input
          type="password"
          placeholder="Current password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          aria-label="Current password"
        />
      )}
      <Input
        type="password"
        placeholder="New password (min 8)"
        value={next}
        onChange={(e) => setNext(e.target.value)}
        aria-label="New password"
      />
      <Input
        type="password"
        placeholder="Confirm new password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        aria-label="Confirm new password"
      />
      <Button
        variant="primary"
        size="sm"
        disabled={next.length < 8 || next !== confirm || (hasPassword && !current)}
        onClick={() => (hasPassword ? change.mutate() : setInitial.mutate())}
      >
        {hasPassword ? "Change password" : "Set password"}
      </Button>
    </Card>
  );
}
